import * as markdoc from "@markdoc/markdoc";
import type { Config } from "@markdoc/markdoc";

markdoc.transformer.findSchema = (node, config) => {
  return node.tag
    ? (config?.tags?.[node.tag] ?? config?.tags?.$$fallback)
    : config?.nodes?.[node.type];
};

export default {
  tags: {
    $$fallback: {
      transform(node, config) {
        const children = node.transformChildren(config);
        const className = "cm-markdoc-fallbackTag";
        return new markdoc.Tag("div", { class: className }, [
          new markdoc.Tag("div", { class: `${className}--name` }, [
            node?.tag ?? "",
          ]),
          new markdoc.Tag("div", { class: `${className}--inner` }, children),
        ]);
      },
    },
    callout: {
      transform(node, config) {
        const children = node.transformChildren(config);
        const kind = ["warning", "error", "info"].includes(node.attributes.type)
          ? node.attributes.type
          : "info";
        const className = `cm-markdoc-callout cm-markdoc-callout--${kind}`;
        return new markdoc.Tag("div", { class: className }, [
          new markdoc.Tag("span", { class: `icon icon-${kind}` }),
          new markdoc.Tag("div", {}, children),
        ]);
      },
    },
  },
} as Config;
