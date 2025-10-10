import React, { useCallback } from "react";
import { useMaskito } from "@maskito/react";

import type { FieldPropArgs, FieldPropConfig } from "./_abstractProp";
import { ipv4CidrMaskOptions } from "../CIDRMasks";
import { Input } from "../primitives/input";
import { Label } from "../primitives/label";

function SubnetInput({
  value,
  onChange,
  onFocus,
  disabled,
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
  value,
  setValue,
  label,
  lockField,
  disabled,
}: FieldPropArgs) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value.trim()),
    [setValue],
  );

  return (
    <div className="gap-1 flex flex-col">
      <Label className="text-xs font-medium block">{label}</Label>
      <SubnetInput
        value={value?.toString() ?? ""}
        onChange={handleChange}
        onFocus={lockField}
        disabled={disabled}
      />
    </div>
  );
}

const config: FieldPropConfig = {
  prop: "subnet",
  label: "Подсеть",
  component: SubnetProp,
};
export default config;
