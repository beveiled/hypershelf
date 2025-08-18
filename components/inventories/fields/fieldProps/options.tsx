import { Label } from "@/components/ui/label";
import { OptionsInput } from "@/components/ui/options-input";
import { useCallback } from "react";
import { FieldPropArgs, FieldPropConfig } from "./_abstractProp";

function OptionsProp({
  prop,
  value,
  label,
  lockField,
  isLockedBySomeoneElse,
  change
}: FieldPropArgs) {
  const handleChange = useCallback(
    (opts: string[]) => {
      change(prop, opts);
    },
    [change, prop]
  );

  return (
    <div className="flex flex-col gap-1">
      <Label className="block text-xs font-medium">{label}</Label>
      <OptionsInput
        options={(value as string[] | undefined) || []}
        onChange={handleChange}
        onFocus={lockField}
        disabled={isLockedBySomeoneElse}
      />
    </div>
  );
}

const config: FieldPropConfig = {
  prop: "options",
  label: "Варианты",
  component: OptionsProp
};
export default config;
