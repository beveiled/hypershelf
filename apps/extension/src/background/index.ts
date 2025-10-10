import type { BgReq, BgRes, Tokens } from "../shared/types";
import { PUBLIC_CONVEX_SITE_URL, PUBLIC_FRONTEND_URL } from "~/shared/env";

interface Stored {
  token?: string;
  refreshToken?: string;
}

class Auth {
  private token: string | null = null;
  private refreshToken: string | null = null;
  private authInProgress = false;

  constructor() {
    void this.init();
  }

  private async init(): Promise<void> {
    const s = (await chrome.storage.local.get([
      "token",
      "refreshToken",
    ])) satisfies Stored;
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
    if (this.token && this.refreshToken) {
      return {
        type: "AUTH_OK",
        payload: { token: this.token, refreshToken: this.refreshToken },
      };
    }
    const redirectUrl = chrome.identity.getRedirectURL("provider_cb");
    const authUrl = new URL(`${PUBLIC_FRONTEND_URL}/integrations/auth`);
    authUrl.searchParams.set("redirect_uri", redirectUrl);
    authUrl.searchParams.set("state", "hypershelf");
    if (this.authInProgress)
      return { type: "ERROR", message: "Auth already in progress" };
    this.authInProgress = true;
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
    const tokenRes = await fetch(`${PUBLIC_CONVEX_SITE_URL}/ingestSigil`, {
      method: "POST",
      headers: { "x-sigil": sigil },
    });
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

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  const run = async (): Promise<void> => {
    const m = msg as BgReq;

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

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (m.type === "AUTH_RESET") {
      await chrome.storage.local.remove(["token", "refreshToken"]);
      auth.clear();
      const r = await auth.ensure();
      sendResponse(r);
      return;
    }

    sendResponse({ type: "ERROR", message: "Unknown message" } as BgRes);
  };

  void run();
  return true;
});
