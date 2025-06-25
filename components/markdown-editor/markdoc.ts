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
            node?.tag ?? ""
          ]),
          new markdoc.Tag("div", { class: `${className}--inner` }, children)
        ]);
      }
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
          new markdoc.Tag("div", {}, children)
        ]);
      }
    }
  }
} as Config;
