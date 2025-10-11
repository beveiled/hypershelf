import type { JSX } from "react";

export type Widget = ({ hostname }: { hostname: string | null }) => JSX.Element;

export interface AdapterContext {
  win: Window;
  doc: Document;
}

export interface ConnectorAdapter {
  readonly id: string;
  readonly widget: Widget;
  readonly banner: string;
  readonly anchorSelectors: string[];
  readonly anchorPosition: "before" | "after" | "instead" | "start" | "end";
  readonly observableSelectors: string[];
  readonly mountStyles?: React.CSSProperties;
  extractHostname(ctx: AdapterContext): string | null;
}
