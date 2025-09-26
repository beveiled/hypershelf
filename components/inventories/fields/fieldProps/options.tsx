import { Label } from "@/components/ui/label";
import { OptionsInput } from "@/components/ui/options-input";
import { FieldPropArgs, FieldPropConfig } from "./_abstractProp";
import { useCallback } from "react";

function OptionsProp({
  value,
  setValue,
  label,
  lockField,
  disabled,
}: FieldPropArgs) {
  const handleChange = useCallback(
    (opts: string[]) => setValue(opts),
    [setValue],
  );

  return (
    <div className="flex flex-col gap-1">
      <Label className="block text-xs font-medium">{label}</Label>
      <OptionsInput
        options={(value as string[] | undefined) || []}
        onChange={handleChange}
        onFocus={lockField}
        disabled={disabled}
      />
    </div>
  );
}

const config: FieldPropConfig = {
  prop: "options",
  label: "Варианты",
  component: OptionsProp,
};
export default config;
