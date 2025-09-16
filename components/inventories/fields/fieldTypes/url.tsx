import { FieldPropConfig } from "./_abstractType";
import { InlineString } from "./string";

const config: FieldPropConfig = {
  key: "url",
  label: "Ссылка",
  icon: "link-2",
  fieldProps: ["placeholder"],
  component: InlineString,
};

export default config;
