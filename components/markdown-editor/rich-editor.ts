import highlightStyle from "./highlight-style";
import renderBlock from "./render-block";
import RichEditPlugin from "./rich-edit";
import tagParser from "./tag-parser";
import { markdown } from "@codemirror/lang-markdown";
import {
  Language,
  LanguageDescription,
  syntaxHighlighting,
} from "@codemirror/language";
import { ViewPlugin } from "@codemirror/view";
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
    extensions: [tagParser, ...(config.lezer?.extensions ?? [])],
  };

  return ViewPlugin.fromClass(RichEditPlugin, {
    decorations: v => v.decorations,
    provide: () => [
      renderBlock(config.markdoc),
      syntaxHighlighting(highlightStyle),
      markdown(mergedConfig),
    ],
    eventHandlers: {
      mousedown(event, view) {
        if (!(event.target instanceof Element)) return;

        if (event.target.matches(".cm-markdoc-renderBlock *")) {
          view.dispatch({ selection: { anchor: view.posAtDOM(event.target) } });
          return;
        }
      },
    },
  });
}
