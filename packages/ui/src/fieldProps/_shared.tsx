import React, { useCallback } from "react";

import type { FieldPropArgs } from "./_abstractProp";
import { Checkbox } from "../primitives/checkbox";
import { Input } from "../primitives/input";
import { Label } from "../primitives/label";

export function PropNumberInput({
  value,
  setValue,
  label,
  lockField,
  disabled,
}: FieldPropArgs) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setValue(e.target.value === "" ? null : Number(e.target.value)),
    [setValue],
  );

  return (
    <div className="gap-1 flex flex-col">
      <Label className="text-xs font-medium block">{label}</Label>
      <Input
        type="number"
        value={value?.toString() ?? ""}
        onChange={handleChange}
        onFocus={lockField}
        disabled={disabled}
        className="text-sm"
      />
    </div>
  );
}

export function PropStringInput({
  value,
  setValue,
  label,
  lockField,
  disabled,
}: FieldPropArgs) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value),
    [setValue],
  );

  return (
    <div className="gap-1 flex flex-col">
      <Label className="text-xs font-medium block">{label}</Label>
      <Input
        value={value?.toString() ?? ""}
        onChange={handleChange}
        onFocus={lockField}
        disabled={disabled}
        className="text-sm"
      />
    </div>
  );
}

export function PropBooleanInput({
  value,
  setValue,
  label,
  lockField,
  disabled,
}: FieldPropArgs) {
  const handleChange = useCallback(
    (e: boolean) => {
      lockField();
      setValue(e);
    },
    [setValue, lockField],
  );

  return (
    <div className="gap-2 flex items-center">
      <Checkbox
        checked={!!value}
        onCheckedChange={handleChange}
        disabled={disabled}
      />
      <Label className="text-xs font-medium">{label}</Label>
    </div>
  );
}
