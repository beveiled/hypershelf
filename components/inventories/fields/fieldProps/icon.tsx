import { IconName, IconPicker } from "@/components/ui/icon-picker";
import { Label } from "@/components/ui/label";
import { FieldPropArgs, FieldPropConfig } from "./_abstractProp";
import { useCallback } from "react";

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
    <div className="flex flex-col gap-1">
      <Label className="block text-xs font-medium">{label}</Label>
      <IconPicker
        value={(value as IconName) || ""}
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
