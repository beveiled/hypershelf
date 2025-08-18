import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ValueType } from "@/convex/schema";
import React, { useCallback } from "react";
import { EditableKey } from "../fieldTypes";

export type FieldPropArgs = {
  prop: EditableKey;
  value: ValueType;
  label: string;
  lockField: () => void;
  isLockedBySomeoneElse: boolean;
  change: (key: EditableKey, value: ValueType) => void;
};

export function AbstractProp({}: FieldPropArgs): React.ReactNode {
  return <div>Abstract Prop</div>;
}

export function PropNumberInput({
  prop,
  value,
  label,
  lockField,
  isLockedBySomeoneElse,
  change
}: FieldPropArgs) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      change(prop, e.target.value === "" ? undefined : Number(e.target.value));
    },
    [change, prop]
  );

  return (
    <div className="flex flex-col gap-1">
      <Label className="block text-xs font-medium">{label}</Label>
      <Input
        type="number"
        value={value?.toString() || ""}
        onChange={handleChange}
        onFocus={lockField}
        disabled={isLockedBySomeoneElse}
        className="text-sm"
      />
    </div>
  );
}

export function PropStringInput({
  prop,
  value,
  label,
  lockField,
  isLockedBySomeoneElse,
  change
}: FieldPropArgs) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      change(prop, e.target.value);
    },
    [change, prop]
  );

  return (
    <div className="flex flex-col gap-1">
      <Label className="block text-xs font-medium">{label}</Label>
      <Input
        value={value?.toString() || ""}
        onChange={handleChange}
        onFocus={lockField}
        disabled={isLockedBySomeoneElse}
        className="text-sm"
      />
    </div>
  );
}

export function PropBooleanInput({
  prop,
  value,
  label,
  lockField,
  isLockedBySomeoneElse,
  change
}: FieldPropArgs) {
  const handleChange = useCallback(
    (e: boolean) => {
      lockField?.();
      change(prop, e);
    },
    [change, prop, lockField]
  );

  return (
    <div className="flex items-center gap-2">
      <Checkbox
        checked={!!value}
        onCheckedChange={handleChange}
        disabled={isLockedBySomeoneElse}
      />
      <Label className="text-xs font-medium">{label}</Label>
    </div>
  );
}

export type FieldPropConfig = {
  prop: EditableKey;
  label: string;
  component: typeof AbstractProp;
  full?: boolean;
};
