import { useCallback } from "react";

import type { FieldPropArgs, FieldPropConfig } from "./_abstractProp";
import { Label } from "../primitives/label";
import { OptionsInput } from "../primitives/options-input";

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
    <div className="gap-1 flex flex-col">
      <Label className="text-xs font-medium block">{label}</Label>
      <OptionsInput
        options={(value as string[] | undefined) ?? []}
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
