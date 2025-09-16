/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MultiSelect } from "./multiselect";
import { toSelectOptions } from "./utils";
import type { ComponentPropsWithoutRef } from "react";
import type { VersatileSelectorProps } from "react-querybuilder";

export type ShadcnUiValueSelectorProps = VersatileSelectorProps &
  ComponentPropsWithoutRef<typeof Select>;

export const ShadcnUiValueSelector = ({
  handleOnChange,
  options,
  value,
  title,
  disabled,
  // Props that should not be in extraProps
  testID: _testID,
  rule: _rule,
  rules: _rules,
  level: _level,
  path: _path,
  context: _context,
  validation: _validation,
  operator: _operator,
  field: _field,
  fieldData: _fieldData,
  multiple: _multiple,
  listsAsArrays: _listsAsArrays,
  schema: _schema,
  ...extraProps
}: ShadcnUiValueSelectorProps) => {
  return _multiple ? (
    <MultiSelect
      options={options}
      value={value as unknown as string[]}
      onValueChange={handleOnChange}
    />
  ) : (
    <Select
      value={value}
      disabled={disabled}
      onValueChange={handleOnChange}
      {...extraProps}
    >
      <SelectTrigger size="sm">
        <SelectValue placeholder={title} />
      </SelectTrigger>
      <SelectContent>{toSelectOptions(options)}</SelectContent>
    </Select>
  );
};

ShadcnUiValueSelector.displayName = "ShadcnUiValueSelector";
