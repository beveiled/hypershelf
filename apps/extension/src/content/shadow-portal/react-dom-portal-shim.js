/* @babel-ignore babel-plugin-react-dom-portal-shim */
import * as Real from "react-dom";

import {
  getShadowPortalContainer,
  getShadowPortalShadowRoot,
} from "./portal-api";

export * from "react-dom";

/** @type {function(Element|DocumentFragment): boolean} */
function shouldRedirect(container) {
  if (container === document.body || container === document.documentElement)
    return true;
  const rn =
    typeof container.getRootNode === "function"
      ? container.getRootNode()
      : null;
  const sr = getShadowPortalShadowRoot();
  if (!rn) return true;
  if (sr && rn !== sr) return true;
  return false;
}

/** @type {typeof Real.createPortal} */
export function createPortal(node, container, key) {
  const target = shouldRedirect(container)
    ? (getShadowPortalContainer() ?? document.body)
    : container;
  return Real.createPortal(node, target, key ?? null);
}

export default { ...Real, createPortal };
