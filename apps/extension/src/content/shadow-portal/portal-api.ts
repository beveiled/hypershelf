let container: Element | null = null;
let shadowRoot: ShadowRoot | null = null;
export function setShadowPortalContainer(el: Element): void {
  container = el;
  const rn = el.getRootNode();
  shadowRoot = rn instanceof ShadowRoot ? rn : null;
}
export function getShadowPortalContainer(): Element | null {
  return container;
}
export function getShadowPortalShadowRoot(): ShadowRoot | null {
  return shadowRoot;
}
