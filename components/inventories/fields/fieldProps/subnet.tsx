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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMaskito } from "@maskito/react";
import React, { useCallback } from "react";
import { ipv4CidrMaskOptions } from "../CIDRMasks";
import { FieldPropArgs, FieldPropConfig } from "./_abstractProp";

function SubnetInput({
  value,
  onChange,
  onFocus,
  disabled
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus: () => void;
  disabled: boolean;
}) {
  const subnetRef = useMaskito({ options: ipv4CidrMaskOptions });
  return (
    <Input
      ref={subnetRef}
      value={value}
      onChange={onChange}
      onFocus={onFocus}
      placeholder="0.0.0.0/0"
      disabled={disabled}
    />
  );
}

function SubnetProp({
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
      <SubnetInput
        value={value?.toString() || ""}
        onChange={handleChange}
        onFocus={lockField}
        disabled={isLockedBySomeoneElse}
      />
    </div>
  );
}

const config: FieldPropConfig = {
  prop: "subnet",
  label: "Подсеть",
  component: SubnetProp
};
export default config;
