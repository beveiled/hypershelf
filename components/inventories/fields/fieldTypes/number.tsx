import { FieldPropConfig } from "./_abstractType";
import { InlineString } from "./string";

const config = {
  key: "number",
  label: "Число",
  icon: "hash",
  fieldProps: ["placeholder", "minValue", "maxValue"],
  component: InlineString,
} as const satisfies FieldPropConfig;

export default config;
