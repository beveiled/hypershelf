import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldPropArgs } from "./_abstractProp";
import React, { useCallback } from "react";

export function PropNumberInput({
  value,
  setValue,
  label,
  lockField,
  disabled,
}: FieldPropArgs) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setValue(e.target.value === "" ? undefined : Number(e.target.value)),
    [setValue],
  );

  return (
    <div className="flex flex-col gap-1">
      <Label className="block text-xs font-medium">{label}</Label>
      <Input
        type="number"
        value={value?.toString() || ""}
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
    <div className="flex flex-col gap-1">
      <Label className="block text-xs font-medium">{label}</Label>
      <Input
        value={value?.toString() || ""}
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
      lockField?.();
      setValue(e);
    },
    [setValue, lockField],
  );

  return (
    <div className="flex items-center gap-2">
      <Checkbox
        checked={!!value}
        onCheckedChange={handleChange}
        disabled={disabled}
      />
      <Label className="text-xs font-medium">{label}</Label>
    </div>
  );
}
