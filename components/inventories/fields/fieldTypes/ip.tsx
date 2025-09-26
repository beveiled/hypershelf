import { FieldPropConfig } from "./_abstractType";
import { InlineString } from "./string";

const config = {
  key: "ip",
  label: "IP",
  icon: "ethernet-port",
  fieldProps: ["placeholder", "subnet"],
  component: InlineString,
} as const satisfies FieldPropConfig;

export default config;
