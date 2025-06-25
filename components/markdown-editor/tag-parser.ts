/*
https://github.com/hikariatama/hypershelf
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
import { Tag, tags as t } from "@lezer/highlight";
import type { MarkdownConfig, InlineContext } from "@lezer/markdown";
import { Strikethrough } from "@lezer/markdown";

export const highlightTag = Tag.define("Highlight");

const Rich: MarkdownConfig = {
  defineNodes: [
    { name: "MarkdocTag", block: true, style: t.meta },
    { name: "EmbedTagMeta", style: t.meta },
    { name: "EmbedTagUrl", style: t.url }
  ],
  parseBlock: [
    {
      name: "MarkdocTag",
      endLeaf(_cx, line) {
        return (
          line.next === 123 && // '{'
          line.text.slice(line.pos).trim().startsWith("{%")
        );
      },
      parse(cx, line) {
        if (line.next !== 123) return false;
        const content = line.text.slice(line.pos).trim();
        if (!content.startsWith("{%") || !content.endsWith("%}")) return false;

        cx.addElement(
          cx.elt("MarkdocTag", cx.lineStart, cx.lineStart + line.text.length)
        );
        cx.nextLine();
        return true;
      }
    },
    {
      name: "EmbedTag",
      parse(cx, line) {
        const text = line.text.slice(line.pos).trim();
        if (!text.startsWith("!((")) return false;

        const closeIndex = text.indexOf("))", 3);
        if (closeIndex === -1) return false;

        const base = cx.lineStart + line.pos;
        cx.addElement(cx.elt("EmbedTagMeta", base, base + 3));
        cx.addElement(cx.elt("EmbedTagUrl", base + 3, base + closeIndex));
        cx.addElement(
          cx.elt("EmbedTagMeta", base + closeIndex, base + closeIndex + 2)
        );

        cx.nextLine();
        return true;
      }
    }
  ]
};

const HIGHLIGHT_DELIM = {
  resolve: "Highlight",
  mark: "HighlightMark"
} as const;
const PUNCTUATION = /[!-/:-@[-`{-~\u00A1\u2010-\u2027]/u;

const Highlight: MarkdownConfig = {
  defineNodes: [
    { name: "Highlight", style: highlightTag },
    { name: "HighlightMark", style: t.processingInstruction }
  ],

  parseInline: [
    {
      name: "Highlight",
      parse(cx: InlineContext, next: number, pos: number) {
        if (next !== 61 || cx.char(pos + 1) !== 61 || cx.char(pos + 2) === 61) {
          return -1;
        }

        const before = cx.slice(pos - 1, pos);
        const after = cx.slice(pos + 2, pos + 3);

        const sBefore = /^\s?$/.test(before);
        const sAfter = /^\s?$/.test(after);
        const pBefore = PUNCTUATION.test(before);
        const pAfter = PUNCTUATION.test(after);

        return cx.addDelimiter(
          HIGHLIGHT_DELIM,
          pos,
          pos + 2,
          !sAfter && (!pAfter || sBefore || pBefore),
          !sBefore && (!pBefore || sAfter || pAfter)
        );
      },
      after: "Emphasis"
    }
  ]
};

export default [
  Rich,
  Highlight,
  Strikethrough
] as const satisfies readonly MarkdownConfig[];
