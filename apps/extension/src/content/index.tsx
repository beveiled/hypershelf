import { useEffect, useState } from "react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient, useQuery } from "convex/react";
import { createRoot } from "react-dom/client";

import { api } from "@hypershelf/convex/_generated/api";
import { useConvex } from "@hypershelf/lib/hooks";

import type { Tokens } from "../shared/types";
import type { SiteAdapter } from "./adapters/types";
import { PUBLIC_CONVEX_BACKEND_URL } from "~/shared/env";
import { ensureTokens, resetAuth } from "../shared/auth";
import { adapters } from "./adapters";

import "./shared.css";

const convex = new ConvexReactClient(PUBLIC_CONVEX_BACKEND_URL);

let adapterSelected = false;

const selectAdapter = (win: Window, doc: Document): SiteAdapter | null => {
  for (const a of adapters) {
    if (a.detect({ win, doc })) return a;
  }
  return null;
};

const Utils = ({ setTokens }: { setTokens: (t: Tokens) => void }) => {
  useConvex();

  const isAuthed = useQuery(api.auth.isAuthed);
  useEffect(() => {
    const handler = setTimeout(() => {
      if (isAuthed?.authed === false) {
        void resetAuth()
          .then((t) => setTokens(t))
          .catch(() => null);
      }
    }, 3000);
    return () => {
      clearTimeout(handler);
    };
  }, [isAuthed, setTokens]);

  return null;
};

const App = ({ adapter }: { adapter: SiteAdapter }) => {
  const [tokens, setTokens] = useState<Tokens | null>(null);
  const [hostname, setHostname] = useState<string | null>(null);

  useEffect(() => {
    void ensureTokens()
      .then((t) => setTokens(t))
      .catch(() => null);
  }, []);

  useEffect(() => {
    const dispose = adapter.observe(
      { win: window, doc: document },
      (hostname) => {
        if (hostname !== null) setHostname(hostname);
      },
    );
    return () => dispose();
  }, [adapter]);

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
      <adapter.component hostname={hostname} />
    </ConvexAuthProvider>
  );
};

const boot = (): void => {
  const adapter = selectAdapter(window, document);
  if (!adapter) return;
  const host = adapter.mountTarget({ win: window, doc: document });
  if (!host) return;
  adapterSelected = true;
  console.log(
    "%c ",
    `
    background-image: url(data:image/svg+xml;base64,PHN2ZyBpZD0iYSIgZGF0YS1uYW1lPSJMYXllciAxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0MjMuNSA3MSI+CiAgPHJlY3Qgd2lkdGg9IjQyMy41IiBoZWlnaHQ9IjcxIiBmaWxsPSIjMDBhIi8+CiAgPHRleHQgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMTYgMjEuOSkiIGZpbGw9IiNmZmYiIGZvbnQtZmFtaWx5PSJTeW5lLUV4dHJhQm9sZCwgU3luZSIgZm9udC1zaXplPSIxMiIgZm9udC12YXJpYXRpb24tc2V0dGluZ3M9IiZhcG9zO3dnaHQmYXBvczsgODAwIiBmb250LXdlaWdodD0iNzAwIj48dHNwYW4geD0iMCIgeT0iMCI+SHlwZXJzaGU8L3RzcGFuPjx0c3BhbiB4PSI5Mi4wOSIgeT0iMCIgbGV0dGVyLXNwYWNpbmc9Ii0uMDJlbSI+bDwvdHNwYW4+PHRzcGFuIHg9Ijk2LjE3IiB5PSIwIiBsZXR0ZXItc3BhY2luZz0iMGVtIj5mPC90c3Bhbj48L3RleHQ+CiAgPGxpbmUgeDE9IjE2LjU5IiB5MT0iMjQuMjUiIHgyPSIzMS4wNyIgeTI9IjI0LjI1IiBmaWxsPSJub25lIiBzdHJva2U9IiM5Y2U4MjQiIHN0cm9rZS1taXRlcmxpbWl0PSIxMCIgc3Ryb2tlLXdpZHRoPSIyIi8+CiAgPHRleHQgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMTYgNTMpIiBmaWxsPSIjZmZmIiBmb250LWZhbWlseT0iUGVyZmVjdERPU1ZHQTQzN1dpbiwgJmFwb3M7UGVyZmVjdCBET1MgVkdBIDQzNyBXaW4mYXBvczsiIGZvbnQtc2l6ZT0iMjQiPjx0c3BhbiB4PSIwIiB5PSIwIj5Cb290aW5nIHVwIHRoZSBpbnRlZ3JhdGlvbi4uLjwvdHNwYW4+PC90ZXh0Pgo8L3N2Zz4=);
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
    background-color: #00a;
    padding-right: 350px;
    padding-bottom: 50px;
    `,
  );
  console.log("[Hypershelf] Mounted adapter:", adapter.id);
  createRoot(host).render(<App adapter={adapter} />);
};

const interval = setInterval(() => {
  if (adapterSelected) {
    clearInterval(interval);
    return;
  }

  boot();
}, 1000);
