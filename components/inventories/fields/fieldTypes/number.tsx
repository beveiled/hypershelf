import { FieldPropConfig } from "./_abstractType";
import { InlineString } from "./string";

const config: FieldPropConfig = {
  key: "number",
  label: "Число",
  icon: "hash",
  fieldProps: ["placeholder", "minValue", "maxValue"],
  component: InlineString,
};

export default config;
