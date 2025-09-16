import { Facet } from "@codemirror/state";

export const previewModeFacet = Facet.define<boolean, boolean>({
  combine: values => values.some(Boolean),
});
