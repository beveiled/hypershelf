import { FieldPropConfig } from "./_abstractType";
import { InlineString } from "./string";

const config = {
  key: "magic__ip",
  label: "IP",
  icon: "ethernet-port",
  fieldProps: ["placeholder", "subnet"],
  magic: true,
  component: InlineString,
} as const satisfies FieldPropConfig;

export default config;
