/* eslint-disable @next/next/no-page-custom-font */
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ExtendedAssetType, ExtendedFieldType } from "@/convex/schema";
import { useHypershelf } from "@/stores";
import { ensureTokens, resetAuth } from "../shared/auth";
import { isVsphere } from "../shared/ids";
import type {
  BgReq,
  BgRes,
  BgSignal,
  ExtractedIds,
  Tokens,
} from "../shared/types";
import { Panel } from "../ui/panel";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL!);

const mountTarget = (): HTMLElement | null => {
  const insertBefore = document.querySelector(
    'div[portlet-id="vsphere.core.vm.summary.annotationsNotesView"]',
  );
  if (!insertBefore) return null;
  let host = document.getElementById("hypershelf-vsphere-root");
  if (host) return host;
  host = document.createElement("div");
  host.id = "hypershelf-vsphere-root";
  insertBefore.parentElement?.insertBefore(host, insertBefore);
  return host;
};

const observeRoot = (): void => {
  const observer = new MutationObserver(() => {
    const host = document.getElementById("hypershelf-vsphere-root");
    const insertBefore = document.querySelector(
      'div[portlet-id="vsphere.core.vm.summary.annotationsNotesView"]',
    );

    if (insertBefore && !host) {
      boot();
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
};

const Utils = ({ setTokens }: { setTokens: (t: Tokens) => void }) => {
  const isAuthed = useQuery(api.auth.isAuthed);
  useEffect(() => {
    const handler = setTimeout(() => {
      if (isAuthed?.authed === false) {
        void resetAuth().then(t => setTokens(t));
      }
    }, 3000);

    return () => {
      clearTimeout(handler);
    };
  }, [isAuthed, setTokens]);

  const { viewer: unstableViewer } = useQuery(api.users.me) ?? {};
  const { fields: unstableFields } = useQuery(api.fields.get, {}) ?? {};
  const { assets: unstableAssets } = useQuery(api.assets.get, {}) ?? {};

  const setViewer = useHypershelf(state => state.setViewer);
  const setFields = useHypershelf(state => state.setFields);
  const setAssets = useHypershelf(state => state.setAssets);

  useEffect(() => {
    if (unstableViewer) setViewer(unstableViewer);
  }, [unstableViewer, setViewer]);

  useEffect(() => {
    if (unstableFields) {
      const newFields: Record<Id<"fields">, ExtendedFieldType> = {};
      unstableFields.forEach(field => (newFields[field.field._id] = field));
      setFields(newFields);
    }
  }, [unstableFields, setFields]);

  useEffect(() => {
    if (unstableAssets) {
      const newAssets: Record<Id<"assets">, ExtendedAssetType> = {};
      unstableAssets.forEach(asset => (newAssets[asset.asset._id] = asset));
      setAssets(newAssets);
    }
  }, [unstableAssets, setAssets]);

  return null;
};

const App = () => {
  const [tokens, setTokens] = useState<Tokens | null>(null);
  const [hostname, setHostname] = useState<string | null>(null);
  const [refetchKey, setRefetchKey] = useState<number>(0);

  useEffect(() => {
    void ensureTokens().then(t => setTokens(t));
  }, []);

  useEffect(() => {
    chrome.runtime
      .sendMessage({ type: "ATTACH_OBSERVER" } as BgReq)
      .catch(() => {});
    chrome.runtime
      .sendMessage({ type: "GET_IDS" } as BgReq)
      .then(res => {
        const r = res as BgRes;
        if (r.type === "IDS") {
          const h = r.payload.dns;
          setHostname(h);
          setRefetchKey(v => v + 1);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const port = chrome.runtime.connect({ name: "hs-relay" });
    const onWindowMessage = (e: MessageEvent) => {
      const data = e.data as { type?: string; payload?: ExtractedIds };
      if (data && data.type === "HS_IDS_CHANGE") {
        const p = data.payload;
        if (p) {
          const h = p.dns;
          if (h) setHostname(h);
          setRefetchKey(v => v + 1);
        }
      }
    };
    window.addEventListener("message", onWindowMessage);
    return () => {
      window.removeEventListener("message", onWindowMessage);
      port.disconnect();
    };
  }, []);

  useEffect(() => {
    const onBg = (msg: BgSignal): void => {
      if (msg.type === "URL_CHANGE") {
        const ok = isVsphere(msg.url);
        if (!ok) return;
        chrome.runtime
          .sendMessage({ type: "GET_IDS" } as BgReq)
          .then(res => {
            const r = res as BgRes;
            if (r.type === "IDS") {
              const h = r.payload.dns;
              setHostname(h);
              setRefetchKey(v => v + 1);
            }
          })
          .catch(() => {});
      }
      if (msg.type === "REFETCH") setRefetchKey(v => v + 1);
    };
    chrome.runtime.onMessage.addListener(onBg);
    return () => chrome.runtime.onMessage.removeListener(onBg);
  }, []);

  if (!tokens) {
    return <div className="text-center">Hypershelf is waiting for auth...</div>;
  }

  const storage = {
    getItem: (key: string): string | null => {
      if (key.startsWith("__convexAuthJWT")) return tokens.token;
      if (key.startsWith("__convexAuthRefreshToken"))
        return tokens.refreshToken;
      return localStorage.getItem(key);
    },
    setItem: (key: string, value: string): void => {
      if (key.startsWith("__convexAuthJWT")) return;
      if (key.startsWith("__convexAuthRefreshToken")) return;
      localStorage.setItem(key, value);
    },
    removeItem: (key: string): void => {
      if (key.startsWith("__convexAuthJWT")) return;
      if (key.startsWith("__convexAuthRefreshToken")) return;
      localStorage.removeItem(key);
    },
  };

  return (
    <ConvexAuthProvider client={convex} storage={storage}>
      <Utils setTokens={setTokens} />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&display=swap"
        rel="stylesheet"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Source+Code+Pro:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <div data-key={refetchKey}>
        <div className="h-38 mb-3 border-2 bg-background rounded-md border-brand flex items-center justify-center">
          <Panel hostname={hostname} convex={convex} />
        </div>
      </div>
    </ConvexAuthProvider>
  );
};

const boot = (): void => {
  const host = mountTarget();
  if (!host) return;
  createRoot(host).render(<App />);
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot, { once: true });
} else {
  boot();
  observeRoot();
}
