import { useCallback } from "react";

import type { IconName } from "../primitives/icon-picker";
import type { FieldPropArgs, FieldPropConfig } from "./_abstractProp";
import { IconPicker } from "../primitives/icon-picker";
import { Label } from "../primitives/label";

function IconProp({
  value,
  setValue,
  label,
  lockField,
  disabled,
}: FieldPropArgs) {
  const handleChange = useCallback(
    (icon: IconName) => setValue(icon),
    [setValue],
  );
  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (open) lockField();
    },
    [lockField],
  );

  return (
    <div className="gap-1 flex flex-col">
      <Label className="text-xs font-medium block">{label}</Label>
      <IconPicker
        value={(value as IconName | undefined) ?? "circle"}
        onValueChange={handleChange}
        onOpenChange={handleOpenChange}
        disabled={disabled}
      />
    </div>
  );
}

const config: FieldPropConfig = {
  prop: "icon",
  label: "Иконка",
  component: IconProp,
};
export default config;
