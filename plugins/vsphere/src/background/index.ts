import { sendToTab } from "../shared/bus";
import { isVsphere } from "../shared/ids";
import type { BgReq, BgRes, ExtractedIds, Tokens } from "../shared/types";

type Stored = { token?: string; refreshToken?: string };
type InPageEvent = { type: "HS_IDS_CHANGE"; payload: ExtractedIds };

class Auth {
  private token: string | null = null;
  private refreshToken: string | null = null;
  private authInProgress: boolean = false;

  constructor() {
    void this.init();
  }

  private async init(): Promise<void> {
    const s = (await chrome.storage.local.get([
      "token",
      "refreshToken",
    ])) as Stored;
    this.token = s.token ?? null;
    this.refreshToken = s.refreshToken ?? null;
  }

  clear(): void {
    this.token = null;
    this.refreshToken = null;
  }

  private async persist(tokens: Tokens): Promise<void> {
    this.token = tokens.token;
    this.refreshToken = tokens.refreshToken;
    await chrome.storage.local.set({
      token: tokens.token,
      refreshToken: tokens.refreshToken,
    });
  }

  async ensure(): Promise<BgRes> {
    if (this.token && this.refreshToken)
      return {
        type: "AUTH_OK",
        payload: { token: this.token, refreshToken: this.refreshToken },
      };
    const redirectUrl = chrome.identity.getRedirectURL("provider_cb");
    const authUrl = new URL(
      `${import.meta.env.VITE_HYPERSHELF_URL}/integrations/auth`,
    );
    authUrl.searchParams.set("redirect_uri", redirectUrl);
    authUrl.searchParams.set("state", "hypershelf");
    if (this.authInProgress)
      return { type: "ERROR", message: "Auth already in progress" };
    this.authInProgress = true;
    console.log("Launching auth flow to", authUrl.toString());
    let responseUrl: string | undefined;
    try {
      responseUrl = await chrome.identity.launchWebAuthFlow({
        url: authUrl.toString(),
        interactive: true,
      });
    } finally {
      this.authInProgress = false;
    }
    if (!responseUrl) return { type: "ERROR", message: "Auth flow failed" };
    const qi = responseUrl.indexOf("?");
    const params = new URLSearchParams(
      qi >= 0 ? responseUrl.slice(qi + 1) : "",
    );
    const sigil = params.get("sigil");
    if (!sigil) return { type: "ERROR", message: "No sigil in response" };
    const tokenRes = await fetch(
      `${import.meta.env.VITE_CONVEX_SITE_URL}/ingestSigil`,
      {
        method: "POST",
        headers: { "x-sigil": sigil },
      },
    );
    if (!tokenRes.ok) return { type: "ERROR", message: "Token request failed" };
    const json = (await tokenRes.json()) as {
      ok?: boolean;
      token?: string;
      refreshToken?: string;
    };
    if (!json.ok || !json.token || !json.refreshToken)
      return { type: "ERROR", message: "No token in response" };
    await this.persist({ token: json.token, refreshToken: json.refreshToken });
    return {
      type: "AUTH_OK",
      payload: { token: json.token, refreshToken: json.refreshToken },
    };
  }

  async handlePersist(payload: Tokens): Promise<BgRes> {
    await this.persist(payload);
    return { type: "AUTH_OK", payload };
  }
}

const auth = new Auth();

const extractIds = async (tabId: number): Promise<ExtractedIds> => {
  const results = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      const pick = (sel: string): string | null => {
        const el = document.querySelector(sel);
        const t = el ? el.textContent : null;
        if (!t) return null;
        const s = t.trim();
        return s.length ? s : null;
      };
      const dns = pick('span[data-test-id="DNS Name:"]');
      const ip =
        pick('span[data-test-id="IP Addresses:"]') ||
        pick('span[data-test-id="IP Address:"]');
      return { dns, ip, url: location.href };
    },
  });
  const first = results[0]?.result as
    | { dns: string | null; ip: string | null; url: string }
    | undefined;
  return {
    dns: first?.dns ?? null,
    ip: first?.ip ?? null,
    url: first?.url ?? "",
  };
};

const attachDomObserver = async (tabId: number): Promise<void> => {
  await chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      let debounceTimer: number | NodeJS.Timeout;
      let lastSentDns: string | null = null;

      const emit = (): void => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          const pick = (sel: string): string | null => {
            const el = document.querySelector(sel);
            const t = el ? el.textContent : null;
            if (!t) return null;
            const s = t.trim();
            return s.length ? s : null;
          };
          const dns = pick('span[data-test-id="DNS Name:"]');
          const ip =
            pick('span[data-test-id="IP Addresses:"]') ||
            pick('span[data-test-id="IP Address:"]');

          if (dns === lastSentDns) {
            return;
          }

          const payload = { dns, ip, url: location.href };
          console.log("Emitting IDs", payload);
          window.postMessage({ type: "HS_IDS_CHANGE", payload }, "*");
          lastSentDns = dns;
        }, 3000);
      };
      const targets = [
        'span[data-test-id="DNS Name:"]',
        'span[data-test-id="IP Addresses:"]',
        'span[data-test-id="IP Address:"]',
      ];
      let observers: MutationObserver[] = [];
      const install = (): void => {
        observers.forEach(o => o.disconnect());
        observers = [];
        targets.forEach(sel => {
          const el = document.querySelector(sel);
          if (!el) return;
          const ob = new MutationObserver(() => emit());
          ob.observe(el, {
            childList: true,
            subtree: true,
            characterData: true,
          });
          observers.push(ob);
        });
        emit();
      };
      install();
      const spa = new MutationObserver(() => install());
      spa.observe(document.documentElement, { childList: true, subtree: true });
      window.addEventListener("popstate", () => emit());
      window.addEventListener("hashchange", () => emit());
    },
  });
};

const handleUrl = async (tabId: number, url: string): Promise<void> => {
  await sendToTab(tabId, { type: "URL_CHANGE", tabId, url });
  if (isVsphere(url)) {
    await attachDomObserver(tabId);
    await sendToTab(tabId, { type: "REFETCH", tabId });
  }
};

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  const run = async (): Promise<void> => {
    const m = msg as BgReq;
    const tabIdFromSender = sender.tab?.id;

    if (m.type === "PING") {
      sendResponse({ type: "PONG" } as BgRes);
      return;
    }

    if (m.type === "AUTH_ENSURE") {
      const r = await auth.ensure();
      sendResponse(r);
      return;
    }

    if (m.type === "AUTH_PERSIST") {
      const r = await auth.handlePersist(m.payload);
      sendResponse(r);
      return;
    }

    if (m.type === "AUTH_RESET") {
      await chrome.storage.local.remove(["token", "refreshToken"]);
      auth.clear();
      const r = await auth.ensure();
      sendResponse(r);
      return;
    }

    if (m.type === "GET_IDS") {
      const tabId = m.tabId ?? tabIdFromSender;
      if (tabId == null) {
        sendResponse({ type: "ERROR", message: "No tabId" } as BgRes);
        return;
      }
      const ids = await extractIds(tabId);
      sendResponse({ type: "IDS", payload: ids } as BgRes);
      return;
    }

    if (m.type === "ATTACH_OBSERVER") {
      const tabId = m.tabId ?? tabIdFromSender;
      if (tabId == null) {
        sendResponse({ type: "ERROR", message: "No tabId" } as BgRes);
        return;
      }
      await attachDomObserver(tabId);
      sendResponse({ type: "PONG" } as BgRes);
      return;
    }

    if (m.type === "DOM_HINT") {
      const tabId = m.tabId ?? tabIdFromSender;
      if (tabId != null) {
        await sendToTab(tabId, { type: "DOM_HINT", tabId });
        await sendToTab(tabId, { type: "REFETCH", tabId });
      }
      sendResponse({ type: "PONG" } as BgRes);
      return;
    }

    sendResponse({ type: "ERROR", message: "Unknown message" } as BgRes);
  };

  void run();
  return true;
});

chrome.webNavigation.onCommitted.addListener(e => {
  if (e.tabId >= 0 && typeof e.url === "string") void handleUrl(e.tabId, e.url);
});
chrome.webNavigation.onHistoryStateUpdated.addListener(e => {
  if (e.tabId >= 0 && typeof e.url === "string") void handleUrl(e.tabId, e.url);
});
chrome.tabs.onUpdated.addListener((tabId, info, tab) => {
  if (info.url && typeof info.url === "string") void handleUrl(tabId, info.url);
  if (tab.url && info.status === "complete") void handleUrl(tabId, tab.url);
});

chrome.runtime.onConnect.addListener(port => {
  if (port.name !== "hs-relay") return;
  port.onMessage.addListener(async raw => {
    const evt = raw as InPageEvent;
    if (evt.type === "HS_IDS_CHANGE" && port.sender?.tab?.id !== undefined) {
      const tabId = port.sender.tab.id;
      await sendToTab(tabId, { type: "DOM_HINT", tabId });
      await sendToTab(tabId, { type: "REFETCH", tabId });
    }
  });
});
