import { FieldPropConfig } from "./_abstractType";
import { InlineString } from "./string";

const config: FieldPropConfig = {
  key: "email",
  label: "Email",
  icon: "at-sign",
  fieldProps: ["placeholder"],
  component: InlineString
};

export default config;
