import { Label } from "@/components/ui/label";
import React from "react";
import { AbstractProp } from "./_abstractProp";
import { IconName, IconPicker } from "@/components/ui/icon-picker";

const key = "icon";

class IconProp extends AbstractProp {
  handleChange = (icon: IconName) => {
    this.props.change(key, icon);
  };

  render() {
    const { value, lockField, isLockedBySomeoneElse } = this.props;
    return (
      <div className="flex flex-col gap-1">
        <Label className="block text-xs font-medium">Иконка</Label>
        <IconPicker
          value={(value as IconName) || ""}
          onValueChange={this.handleChange}
          onOpenChange={lockField}
          disabled={isLockedBySomeoneElse}
        />
      </div>
    );
  }
}

const config = { key, component: IconProp };
export default config;
