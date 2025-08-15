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
import { Switch } from "@/components/ui/switch";
import type { ComponentPropsWithoutRef } from "react";
import type { NotToggleProps } from "react-querybuilder";

export type ChakraNotToggleProps = NotToggleProps &
  ComponentPropsWithoutRef<typeof Switch>;

export const ShadcnUiNotToggle = ({
  className,
  handleOnChange,
  checked,
  disabled,
  label
}: ChakraNotToggleProps) => {
  return (
    <div className="flex items-center space-x-2 text-sm">
      <Switch
        className={className}
        disabled={disabled}
        checked={checked}
        onCheckedChange={handleOnChange}
      />
      <span>{label}</span>
    </div>
  );
};

ShadcnUiNotToggle.displayName = "ShadcnUiNotToggle";
