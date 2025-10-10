import type { ComponentPropsWithoutRef } from "react";
import type { NotToggleProps } from "react-querybuilder";

import { Switch } from "@hypershelf/ui/primitives/switch";

export type ChakraNotToggleProps = NotToggleProps &
  ComponentPropsWithoutRef<typeof Switch>;

export const ShadcnUiNotToggle = (props: ChakraNotToggleProps) => {
  const { className, checked, disabled, label } = props;
  return (
    <div className="space-x-2 text-sm flex items-center">
      <Switch
        className={className}
        disabled={disabled}
        checked={checked}
        onCheckedChange={(v) => props.handleOnChange(v)}
      />
      <span>{label}</span>
    </div>
  );
};

ShadcnUiNotToggle.displayName = "ShadcnUiNotToggle";
