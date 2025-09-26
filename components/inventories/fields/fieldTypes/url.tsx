import { FieldPropConfig } from "./_abstractType";
import { InlineString } from "./string";

const config = {
  key: "url",
  label: "Ссылка",
  icon: "link-2",
  fieldProps: ["placeholder"],
  component: InlineString,
} as const satisfies FieldPropConfig;

export default config;
