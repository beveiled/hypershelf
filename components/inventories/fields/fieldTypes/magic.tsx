import { FieldPropConfig } from "./_abstractType";
import { InlineString } from "./string";

const magicHostnameConfig = {
  key: "magic__hostname",
  label: "Хостнейм",
  icon: "globe",
  fieldProps: ["placeholder", "regex", "regexError"],
  magic: true,
  component: InlineString,
} as const satisfies FieldPropConfig;

const magicIPConfig = {
  key: "magic__ip",
  label: "IP",
  icon: "ethernet-port",
  fieldProps: ["placeholder", "subnet"],
  magic: true,
  component: InlineString,
} as const satisfies FieldPropConfig;

const magicMoidConfig = {
  key: "magic__moid",
  label: "MOID",
  icon: "id-card",
  fieldProps: [],
  magic: true,
  component: InlineString,
} as const satisfies FieldPropConfig;

export { magicHostnameConfig, magicIPConfig, magicMoidConfig };
