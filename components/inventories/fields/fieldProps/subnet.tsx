import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ipv4CidrMaskOptions } from "../CIDRMasks";
import { FieldPropArgs, FieldPropConfig } from "./_abstractProp";
import { useMaskito } from "@maskito/react";
import React, { useCallback } from "react";

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
    <div className="flex flex-col gap-1">
      <Label className="block text-xs font-medium">{label}</Label>
      <SubnetInput
        value={value?.toString() || ""}
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
