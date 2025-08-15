import { Label } from "@/components/ui/label";
import React from "react";
import { AbstractProp } from "./_abstractProp";
import { OptionsInput } from "@/components/ui/options-input";

const key = "options";

class OptionsProp extends AbstractProp {
  handleChange = (opts: string[]) => {
    this.props.change(key, opts);
  };

  render() {
    const { value, lockField, isLockedBySomeoneElse } = this.props;
    return (
      <div className="flex flex-col gap-1">
        <Label className="block text-xs font-medium">Options</Label>
        <OptionsInput
          options={(value as string[] | undefined) || []}
          onChange={this.handleChange}
          onFocus={lockField}
          disabled={isLockedBySomeoneElse}
        />
      </div>
    );
  }
}

const config = { key: key, component: OptionsProp };
export default config;
