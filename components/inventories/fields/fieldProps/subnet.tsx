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
