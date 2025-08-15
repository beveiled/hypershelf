import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMaskito } from "@maskito/react";
import React from "react";
import { ipv4CidrMaskOptions } from "../CIDRMasks";
import { AbstractProp } from "./_abstractProp";

const key = "subnet";

const SubnetInput: React.FC<{
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus: () => void;
  disabled: boolean;
}> = ({ value, onChange, onFocus, disabled }) => {
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
};

class SubnetProp extends AbstractProp {
  handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.props.change(key, e.target.value);
  };

  render() {
    const { value, lockField, isLockedBySomeoneElse } = this.props;
    return (
      <div className="flex flex-col gap-1">
        <Label className="block text-xs font-medium">Subnet</Label>
        <SubnetInput
          value={value?.toString() || ""}
          onChange={this.handleChange}
          onFocus={lockField}
          disabled={isLockedBySomeoneElse}
        />
      </div>
    );
  }
}

const config = { key, component: SubnetProp };
export default config;
