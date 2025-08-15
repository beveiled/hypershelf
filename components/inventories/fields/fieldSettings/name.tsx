import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import React from "react";
import { AbstractProp } from "./_abstractProp";

const key = "name";

class NameProp extends AbstractProp {
  handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.props.change(key, e.target.value);
  };

  render() {
    const { value, lockField, isLockedBySomeoneElse } = this.props;
    return (
      <div className="flex flex-col gap-1">
        <Label className="block text-xs font-medium">Name</Label>
        <Input
          value={value?.toString() || ""}
          onChange={this.handleChange}
          onFocus={lockField}
          disabled={isLockedBySomeoneElse}
        />
      </div>
    );
  }
}

const config = { key, component: NameProp };
export default config;
