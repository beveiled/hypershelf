export function textFromSelector(
  doc: Document,
  selector: string,
): string | null {
  const el = doc.querySelector(selector);
  if (!el) return null;
  const t = el.textContent;
  if (!t) return null;
  const s = t.trim();
  return s.length ? s : null;
}
