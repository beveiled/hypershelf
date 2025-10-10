import type { FieldPropConfig } from "./_abstractType";
import { InlineString } from "./_shared";

const config = {
  key: "string",
  label: "Строка",
  icon: "case-sensitive",
  fieldProps: ["placeholder", "regex", "regexError", "minLength", "maxLength"],
  component: InlineString,
} as const satisfies FieldPropConfig;

export default config;
