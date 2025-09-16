import { FieldPropConfig } from "./_abstractType";
import { InlineString } from "./string";

const config: FieldPropConfig = {
  key: "ip",
  label: "IP",
  icon: "ethernet-port",
  fieldProps: ["placeholder", "subnet"],
  component: InlineString,
};

export default config;
