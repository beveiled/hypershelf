/*
https://github.com/hikariatama/hypershelf
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
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Button } from "@/components/ui/button";
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";
import type { ActionWithRulesProps } from "react-querybuilder";

export type ShadcnUiActionProps = ActionWithRulesProps &
  ComponentPropsWithoutRef<typeof Button>;

export const ShadcnUiActionElementIcon = ({
  className,
  handleOnClick,
  label,
  title,
  disabled,
  disabledTranslation,
  // Props that should not be in extraProps
  testID: _testID,
  rules: _rules,
  level: _level,
  path: _path,
  context: _context,
  validation: _validation,
  ruleOrGroup: _ruleOrGroup,
  schema: _schema,
  ...extraProps
}: ShadcnUiActionProps) => (
  <Button
    size="icon"
    variant="ghost"
    className={cn(className, "flex-none")}
    title={disabledTranslation && disabled ? disabledTranslation.title : title}
    onClick={e => handleOnClick(e)}
    disabled={disabled && !disabledTranslation}
    {...extraProps}
  >
    {disabledTranslation && disabled ? disabledTranslation.label : label}
  </Button>
);

ShadcnUiActionElementIcon.displayName = "ShadcnUiActionElementIcon";
