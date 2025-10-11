import type { PropsWithChildren } from "react";
import {
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";

import { setShadowPortalContainer } from "./portal-api";

type PortalCtx = { root: HTMLElement };
const Ctx = createContext<PortalCtx | null>(null);

export class ShadowPortalController {
  private readonly mainShadowRoot: ShadowRoot;
  private readonly shadowRoot: ShadowRoot;
  private readonly id: string;
  private el: HTMLElement | null = null;

  constructor(
    mainShadowRoot: ShadowRoot,
    shadowRoot: ShadowRoot,
    id = "hs-portal-root",
  ) {
    this.mainShadowRoot = mainShadowRoot;
    this.shadowRoot = shadowRoot;
    this.id = id;
  }

  mount(): HTMLElement {
    if (this.el && this.shadowRoot.contains(this.el)) return this.el;
    const existing = this.shadowRoot.getElementById(this.id);
    if (existing) {
      this.el = existing;
    } else {
      const el = document.createElement("div");
      el.id = this.id;
      el.style.position = "fixed";
      el.style.inset = "0";
      el.style.zIndex = "2147483647";
      el.style.pointerEvents = "none";
      this.shadowRoot.appendChild(el);
      this.el = el;
    }
    setShadowPortalContainer(this.el);
    this.mainShadowRoot.addEventListener("DOMNodeRemoved", (ev) => {
      if (ev.target === this.mainShadowRoot) {
        this.dispose();
      }
    });
    return this.el;
  }

  get element(): HTMLElement {
    return this.el ?? this.mount();
  }

  dispose(): void {
    if (this.el && this.shadowRoot.contains(this.el)) {
      this.el.remove();
      this.el = null;
    }
  }
}

export function useShadowPortalRoot(): HTMLElement {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("Shadow portal root unavailable");
  return ctx.root;
}

export function ShadowPortalProvider({
  mainShadowRoot,
  shadowRoot,
  children,
}: PropsWithChildren<{ mainShadowRoot: ShadowRoot; shadowRoot: ShadowRoot }>) {
  const ref = useRef<ShadowPortalController | null>(null);
  const value = useMemo<PortalCtx>(() => {
    ref.current =
      ref.current ?? new ShadowPortalController(mainShadowRoot, shadowRoot);
    return { root: ref.current.element };
  }, [mainShadowRoot, shadowRoot]);

  useLayoutEffect(() => {
    setShadowPortalContainer(value.root);
    return () => ref.current?.dispose();
  }, [value.root]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
