import type { Range as StateRange } from "@codemirror/state";
import type {
  DecorationSet,
  EditorView,
  PluginValue,
  ViewUpdate,
} from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";
import { Decoration } from "@codemirror/view";

import { previewModeFacet } from "./preview-facet";

const tokenElement = [
  "InlineCode",
  "Emphasis",
  "StrongEmphasis",
  "FencedCode",
  "Link",
  "Highlight",
  "Strikethrough",
];

const tokenHidden = [
  "HardBreak",
  "LinkMark",
  "EmphasisMark",
  "CodeMark",
  "CodeInfo",
  "URL",
  "HighlightMark",
  "StrikethroughMark",
];

const decorationHidden = Decoration.mark({ class: "cm-markdoc-hidden" });
const decorationBullet = Decoration.mark({ class: "cm-markdoc-bullet" });
const decorationCode = Decoration.mark({ class: "cm-markdoc-code" });
const decorationTag = Decoration.mark({ class: "cm-markdoc-tag" });

export default class RichEditPlugin implements PluginValue {
  decorations: DecorationSet;

  constructor(view: EditorView) {
    this.decorations = this.process(view);
  }

  update(update: ViewUpdate): void {
    if (update.docChanged || update.viewportChanged || update.selectionSet)
      this.decorations = this.process(update.view);
  }

  private process(view: EditorView): DecorationSet {
    const widgets: StateRange<Decoration>[] = [];
    const [cursor] = view.state.selection.ranges;
    const preview = view.state.facet(previewModeFacet);

    for (const { from, to } of view.visibleRanges) {
      syntaxTree(view.state).iterate({
        from,
        to,
        enter(node) {
          if (node.name === "MarkdocTag")
            widgets.push(decorationTag.range(node.from, node.to));

          if (node.name === "FencedCode")
            widgets.push(decorationCode.range(node.from, node.to));

          const sel = view.state.selection;
          const isSelected = sel.ranges.some(
            (range) => node.to >= range.from && node.from <= range.to,
          );
          const inside =
            (cursor?.from ?? 0) >= node.from && (cursor?.to ?? 0) <= node.to;

          if (
            node.name === "ListMark" &&
            node.matchContext(["BulletList", "ListItem"]) &&
            (preview ||
              ((cursor?.from ?? 0) !== node.from &&
                (cursor?.from ?? 0) !== node.from + 1 &&
                !isSelected))
          )
            widgets.push(decorationBullet.range(node.from, node.to));

          if (
            !preview &&
            (inside || isSelected) &&
            (node.name.startsWith("ATXHeading") ||
              tokenElement.includes(node.name))
          )
            return false;

          if (node.name === "HeaderMark")
            widgets.push(decorationHidden.range(node.from, node.to + 1));

          if (tokenHidden.includes(node.name))
            widgets.push(decorationHidden.range(node.from, node.to));
        },
      });
    }

    return Decoration.set(widgets);
  }
}
