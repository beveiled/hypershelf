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
import { markdown } from "@codemirror/lang-markdown";
import {
  Language,
  LanguageDescription,
  syntaxHighlighting
} from "@codemirror/language";
import { ViewPlugin } from "@codemirror/view";

import highlightStyle from "./highlight-style";
import renderBlock from "./render-block";
import RichEditPlugin from "./rich-edit";
import tagParser from "./tag-parser";

import { MarkdownExtension } from "@lezer/markdown";
import type { Config } from "@markdoc/markdoc";

export type MarkdocPluginConfig = {
  lezer?: {
    extensions: MarkdownExtension[];
    codeLanguages:
      | readonly LanguageDescription[]
      | ((info: string) => Language | LanguageDescription | null);
  };
  markdoc: Config;
};

export default function richEditor(config: MarkdocPluginConfig) {
  const mergedConfig = {
    ...(config.lezer ?? []),
    extensions: [tagParser, ...(config.lezer?.extensions ?? [])]
  };

  return ViewPlugin.fromClass(RichEditPlugin, {
    decorations: v => v.decorations,
    provide: () => [
      renderBlock(config.markdoc),
      syntaxHighlighting(highlightStyle),
      markdown(mergedConfig)
    ],
    eventHandlers: {
      mousedown(event, view) {
        if (!(event.target instanceof Element)) return;

        if (event.target.matches(".cm-markdoc-renderBlock *")) {
          view.dispatch({ selection: { anchor: view.posAtDOM(event.target) } });
          return;
        }
      }
    }
  });
}
