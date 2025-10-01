import { FieldPropConfig } from "./_abstractType";
import { InlineString } from "./string";

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
  component: () => (
    <div className="text-[10px] text-muted-foreground">
      Добавьте в конфиге этого поля флаг {'"'}Невидимый{'"'}!
    </div>
  ),
} as const satisfies FieldPropConfig;

export { magicIPConfig, magicMoidConfig };
