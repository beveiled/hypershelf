"use node";

export function envelope(inner: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:vim25="urn:vim25" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <soapenv:Body>
    ${inner}
  </soapenv:Body>
</soapenv:Envelope>`;
}

export function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function isElement(n: Node): n is Element {
  return n.nodeType === 1;
}

export function elementsByLocalName(root: Node, local: string): Element[] {
  const out: Element[] = [];
  const stack: Node[] = [root];
  while (stack.length) {
    const n = stack.pop();
    if (
      n &&
      isElement(n) &&
      (n.localName === local || n.nodeName.split(":").pop() === local)
    )
      out.push(n);
    if (n) {
      const children = n.childNodes as NodeListOf<ChildNode> | null;
      if (children)
        for (let i = 0; i < children.length; i++)
          stack.push(children.item(i) as Node);
    }
  }
  return out;
}

export function firstChildByLocalName(
  el: Element,
  local: string,
  maxDepth = 1,
): Element | null {
  if (maxDepth <= 0) {
    return null;
  }

  const childElements: Element[] = [];
  const children = el.childNodes as NodeListOf<ChildNode> | null;
  if (children)
    for (let i = 0; i < children.length; i++) {
      const n = children.item(i) as Node;
      if (isElement(n)) {
        if (n.localName === local || n.nodeName.split(":").pop() === local) {
          return n;
        }
        childElements.push(n);
      }
    }

  if (maxDepth > 1) {
    for (const child of childElements) {
      const found = firstChildByLocalName(child, local, maxDepth - 1);
      if (found) {
        return found;
      }
    }
  }

  return null;
}

export function text(n: Node): string {
  const walker: Node[] = [n];
  let s = "";
  while (walker.length) {
    const cur = walker.pop();
    if (cur && cur.nodeType === 3) s += cur.nodeValue ?? "";
    if (cur) {
      const children = cur.childNodes as NodeListOf<ChildNode> | null;
      if (children)
        for (let i = 0; i < children.length; i++)
          walker.push(children.item(i) as Node);
    }
  }
  return s;
}

export function childrenByLocalName(node: Element, local: string): Element[] {
  const out: Element[] = [];
  const kids = node.childNodes;
  for (let i = 0; i < kids.length; i += 1) {
    const k = kids.item(i);
    if (k.nodeType === 1 && (k as Element).localName === local)
      out.push(k as Element);
  }
  return out;
}

export function parseIsoToMillis(s: string): number {
  if (!s) return 0;
  const m = /^(.+\.\d{3})\d+Z$/.exec(s);
  const t = m ? `${m[1]}Z` : s;
  const n = Date.parse(t);
  return Number.isNaN(n) ? 0 : n;
}
