import type { AdapterContext, SiteAdapter } from "../types";
import { VSphereWidget } from "./ui";

class VsphereAdapter implements SiteAdapter {
  readonly id = "vsphere";
  readonly component = VSphereWidget;

  detect(ctx: AdapterContext): boolean {
    const root = ctx.doc.querySelector(
      'div[portlet-id="vsphere.core.vm.summary.annotationsNotesView"]',
    );
    return root !== null;
  }

  mountTarget(ctx: AdapterContext): HTMLElement | null {
    const insertBefore = ctx.doc.querySelector(
      'div[portlet-id="vsphere.core.vm.summary.annotationsNotesView"]',
    );
    if (!insertBefore) return null;
    let host = ctx.doc.getElementById("hypershelf-widget-root");
    if (host) return host;
    host = ctx.doc.createElement("div");
    host.id = "hypershelf-widget-root";
    host.classList.add("hypershelf__vsphere");
    insertBefore.parentElement?.insertBefore(host, insertBefore);
    return host;
  }

  observe(
    ctx: AdapterContext,
    onChange: (hostname: string | null) => void,
  ): () => void {
    let debounceTimer: number | NodeJS.Timeout | undefined;
    let lastDns: string | null = null;
    let observer: MutationObserver | null = null;
    let spaObserver: MutationObserver | null = null;

    const pick = (sel: string): string | null => {
      const el = ctx.doc.querySelector(sel);
      const t = el ? el.textContent : null;
      if (!t) return null;
      const s = t.trim();
      return s.length ? s : null;
    };

    const emit = (): void => {
      if (debounceTimer) clearTimeout(debounceTimer as number);
      debounceTimer = setTimeout(() => {
        const dns = pick('span[data-test-id="DNS Name:"]');
        if (dns === lastDns) return;
        lastDns = dns ?? null;
        onChange(dns);
      }, 3000);
    };

    const install = (): void => {
      const el = ctx.doc.querySelector('span[data-test-id="DNS Name:"]');
      if (!el) return;
      observer?.disconnect();
      observer = new MutationObserver(() => emit());
      observer.observe(el, {
        childList: true,
        subtree: true,
        characterData: true,
      });
      emit();
    };

    install();

    spaObserver = new MutationObserver(() => {
      const before = ctx.doc.querySelector(
        'div[portlet-id="vsphere.core.vm.summary.annotationsNotesView"]',
      );
      if (before) install();
    });
    spaObserver.observe(ctx.doc.documentElement, {
      childList: true,
      subtree: true,
    });

    const onPop = (): void => emit();
    const onHash = (): void => emit();
    ctx.win.addEventListener("popstate", onPop);
    ctx.win.addEventListener("hashchange", onHash);

    return () => {
      observer?.disconnect();
      spaObserver.disconnect();
      if (debounceTimer) clearTimeout(debounceTimer as number);
      ctx.win.removeEventListener("popstate", onPop);
      ctx.win.removeEventListener("hashchange", onHash);
    };
  }
}

export const vsphereAdapter = new VsphereAdapter();
