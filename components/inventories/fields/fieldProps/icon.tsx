import { IconName, IconPicker } from "@/components/ui/icon-picker";
import { Label } from "@/components/ui/label";
import { FieldPropArgs, FieldPropConfig } from "./_abstractProp";
import { useCallback } from "react";

function IconProp({
  prop,
  value,
  label,
  lockField,
  isLockedBySomeoneElse,
  change,
}: FieldPropArgs) {
  const handleChange = useCallback(
    (icon: IconName) => {
      change(prop, icon);
    },
    [change, prop],
  );

  return (
    <div className="flex flex-col gap-1">
      <Label className="block text-xs font-medium">{label}</Label>
      <IconPicker
        value={(value as IconName) || ""}
        onValueChange={handleChange}
        onOpenChange={lockField}
        disabled={isLockedBySomeoneElse}
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
