import { FieldPropConfig } from "./_abstractType";
import { InlineString } from "./string";

const config = {
  key: "email",
  label: "Email",
  icon: "at-sign",
  fieldProps: ["placeholder"],
  component: InlineString,
} as const satisfies FieldPropConfig;

export default config;
