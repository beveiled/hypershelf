import { FieldPropConfig } from "./_abstractProp";
import { PropBooleanInput } from "./_shared";

const config: FieldPropConfig = {
  prop: "hideFromSearch",
  label: "Не использовать при поиске",
  component: PropBooleanInput,
  full: true,
};
export default config;
