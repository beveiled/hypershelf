/*
https://github.com/beveiled/hypershelf
Copyright (C) 2025  Daniil Gazizullin

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/
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
