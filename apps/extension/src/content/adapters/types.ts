export interface AdapterContext {
  win: Window;
  doc: Document;
}

export interface SiteAdapter {
  readonly id: string;
  readonly component: React.ComponentType<{ hostname: string | null }>;
  detect(ctx: AdapterContext): boolean;
  mountTarget(ctx: AdapterContext): HTMLElement | null;
  observe(
    ctx: AdapterContext,
    onChange: (hostname: string | null) => void,
  ): () => void;
}
