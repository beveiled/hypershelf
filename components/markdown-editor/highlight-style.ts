import { highlightTag } from "./tag-parser";
import { HighlightStyle } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";

export default HighlightStyle.define([
  {
    tag: t.heading1,
    fontWeight: "bold",
    fontSize: "32px",
    textDecoration: "none",
  },
  {
    tag: t.heading2,
    fontWeight: "bold",
    fontSize: "28px",
    textDecoration: "none",
  },
  {
    tag: t.heading3,
    fontWeight: "bold",
    fontSize: "24px",
    textDecoration: "none",
  },
  {
    tag: t.heading4,
    fontWeight: "bold",
    fontSize: "22px",
    textDecoration: "none",
  },
  {
    tag: [t.link, t.url],
    textDecoration: "underline",
    color: "rgb(166, 138, 249)",
  },
  { tag: t.emphasis, fontStyle: "italic" },
  { tag: t.strong, fontWeight: "bold" },
  { tag: t.monospace, fontFamily: "monospace" },
  { tag: t.content },
  {
    tag: [t.meta, t.macroName, t.processingInstruction],
    color: "#666",
    fontFamily: "monospace",
  },
  { tag: [t.comment, t.lineComment, t.blockComment, t.meta], color: "#ababab" },
  { tag: [t.tagName, t.definition(t.tagName), t.deleted], color: "#e93147" },
  { tag: [t.punctuation, t.bracket, t.separator], color: "#5c5c5c" },
  { tag: [t.number, t.bool, t.null, t.atom], color: "#7852ee" },
  {
    tag: [t.string, t.special(t.string), t.character, t.inserted],
    color: "#08b94e",
  },
  { tag: t.operator, color: "#e93147" },
  { tag: [t.propertyName, t.variableName, t.attributeName], color: "#00bfbc" },
  {
    tag: [t.function(t.variableName), t.function(t.propertyName), t.className],
    color: "#e0ac00",
  },
  { tag: [t.keyword, t.controlKeyword, t.moduleKeyword], color: "#d53984" },
  { tag: [t.regexp], color: "#ec7500" },
  {
    tag: [t.contentSeparator, t.labelName],
    color: "#888",
  },
  {
    tag: highlightTag,
    backgroundColor: "rgba(255, 255, 0, 0.3)",
  },
]);
