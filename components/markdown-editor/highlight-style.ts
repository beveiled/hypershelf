/*
https://github.com/beveiled/hypershelf
Copyright (C) 2025  Daniil Gazizullin

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/
import { HighlightStyle } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";
import { highlightTag } from "./tag-parser";

export default HighlightStyle.define([
  {
    tag: t.heading1,
    fontWeight: "bold",
    fontSize: "32px",
    textDecoration: "none"
  },
  {
    tag: t.heading2,
    fontWeight: "bold",
    fontSize: "28px",
    textDecoration: "none"
  },
  {
    tag: t.heading3,
    fontWeight: "bold",
    fontSize: "24px",
    textDecoration: "none"
  },
  {
    tag: t.heading4,
    fontWeight: "bold",
    fontSize: "22px",
    textDecoration: "none"
  },
  {
    tag: [t.link, t.url],
    textDecoration: "underline",
    color: "rgb(166, 138, 249)"
  },
  { tag: t.emphasis, fontStyle: "italic" },
  { tag: t.strong, fontWeight: "bold" },
  { tag: t.monospace, fontFamily: "monospace" },
  { tag: t.content },
  {
    tag: [t.meta, t.macroName, t.processingInstruction],
    color: "#666",
    fontFamily: "monospace"
  },
  { tag: [t.comment, t.lineComment, t.blockComment, t.meta], color: "#ababab" },
  { tag: [t.tagName, t.definition(t.tagName), t.deleted], color: "#e93147" },
  { tag: [t.punctuation, t.bracket, t.separator], color: "#5c5c5c" },
  { tag: [t.number, t.bool, t.null, t.atom], color: "#7852ee" },
  {
    tag: [t.string, t.special(t.string), t.character, t.inserted],
    color: "#08b94e"
  },
  { tag: t.operator, color: "#e93147" },
  { tag: [t.propertyName, t.variableName, t.attributeName], color: "#00bfbc" },
  {
    tag: [t.function(t.variableName), t.function(t.propertyName), t.className],
    color: "#e0ac00"
  },
  { tag: [t.keyword, t.controlKeyword, t.moduleKeyword], color: "#d53984" },
  { tag: [t.regexp], color: "#ec7500" },
  {
    tag: [t.contentSeparator, t.labelName],
    color: "#888"
  },
  {
    tag: highlightTag,
    backgroundColor: "rgba(255, 255, 0, 0.3)"
  }
]);
