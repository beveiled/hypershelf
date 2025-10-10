import type { ValueEditorProps } from "react-querybuilder";
import {
  getFirstOption,
  standardClassnames,
  useValueEditor,
} from "react-querybuilder";

import type { ValueType } from "@hypershelf/convex/schema";
import { cn } from "@hypershelf/lib/utils";
import { Checkbox } from "@hypershelf/ui/primitives/checkbox";
import { Input } from "@hypershelf/ui/primitives/input";
import { Label } from "@hypershelf/ui/primitives/label";
import {
  RadioGroup,
  RadioGroupItem,
} from "@hypershelf/ui/primitives/radio-group";
import { Switch } from "@hypershelf/ui/primitives/switch";
import { Textarea } from "@hypershelf/ui/primitives/textarea";

export type ShadcnUiValueEditorProps = Omit<ValueEditorProps, "value"> & {
  extraProps?: Record<string, unknown>;
} & {
  value?: ValueType;
};

export const ShadcnUiValueEditor = (allProps: ShadcnUiValueEditorProps) => {
  const {
    fieldData,
    operator,
    value,
    title,
    className,
    type,
    inputType,
    values = [],
    listsAsArrays,
    parseNumbers,
    separator,

    valueSource: _vs,
    testID,
    disabled,
    selectorComponent: SelectorComponent = allProps.schema.controls
      .valueSelector,
    extraProps,
    ...props
  } = allProps;

  const { valueAsArray: _valueAsArray, multiValueHandler } = useValueEditor({
    ...allProps,
    handleOnChange: (val) => allProps.handleOnChange(val),
    inputType,
    operator,
    value,
    type,
    listsAsArrays,
    parseNumbers,
    values,
  });

  const valueAsArray = _valueAsArray as string[];

  if (operator === "null" || operator === "notNull") {
    return null;
  }

  const placeHolderText = fieldData.placeholder ?? "";
  const inputTypeCoerced = ["in", "notIn"].includes(operator)
    ? "text"
    : (inputType ?? "text");

  if (
    (operator === "between" || operator === "notBetween") &&
    (type === "select" || type === "text")
  ) {
    const editors = ["from", "to"].map((key, i) => {
      if (type === "text") {
        return (
          <Input
            key={key}
            type={inputTypeCoerced}
            value={valueAsArray[i] ?? ""}
            disabled={disabled}
            className={cn(
              standardClassnames.valueListItem,
              "h-8 text-sm border-0 !bg-transparent",
            )}
            placeholder={placeHolderText}
            onChange={(e) => multiValueHandler(e.target.value, i)}
            {...extraProps}
          />
        );
      }
      return (
        <SelectorComponent
          {...props}
          key={key}
          className={standardClassnames.valueListItem}
          handleOnChange={(v) => multiValueHandler(v, i)}
          disabled={disabled}
          value={valueAsArray[i] ?? getFirstOption(values) ?? undefined}
          options={values}
          listsAsArrays={listsAsArrays}
        />
      );
    });
    return (
      <span
        data-testid={testID}
        className={cn("space-x-2 flex", className)}
        title={title}
      >
        {editors[0]}
        {separator}
        {editors[1]}
      </span>
    );
  }

  switch (type) {
    case "select":
      return (
        <SelectorComponent
          {...props}
          className={className}
          title={title}
          value={value as string | undefined}
          disabled={disabled}
          handleOnChange={(val) => props.handleOnChange(val)}
          options={values}
        />
      );

    case "multiselect":
      return (
        <SelectorComponent
          {...props}
          className={className}
          title={title}
          value={value as unknown as string | undefined}
          disabled={disabled}
          handleOnChange={(val) => props.handleOnChange(val)}
          options={values}
          multiple
        />
      );

    case "textarea":
      return (
        <Textarea
          value={value as string | undefined}
          title={title}
          rows={2}
          disabled={disabled}
          className={cn("min-h-0", className)}
          placeholder={placeHolderText}
          onChange={(e) => props.handleOnChange(e.target.value)}
          {...extraProps}
        />
      );

    case "switch":
      return (
        <Switch
          className={className}
          checked={!!value}
          title={title}
          disabled={disabled}
          onCheckedChange={(v) => props.handleOnChange(v)}
          {...extraProps}
        />
      );

    case "checkbox":
      return (
        <Checkbox
          id={props.rule.id}
          className={cn(className, "size-8 rounded-md")}
          title={title}
          disabled={disabled}
          onCheckedChange={(v) => props.handleOnChange(v)}
          checked={!!value}
          {...extraProps}
        />
      );

    case "radio":
      return (
        <RadioGroup
          className={cn("space-x-2 flex items-center", className)}
          title={title}
          value={value as string | undefined}
          onValueChange={(v) => props.handleOnChange(v)}
          disabled={disabled}
          {...extraProps}
        >
          {values.map((v) => (
            <div
              key={(v as { name: string }).name}
              className="space-x-2 flex items-center"
            >
              <RadioGroupItem
                value={(v as { name: string }).name}
                id={(v as { name: string }).name}
              />
              <Label htmlFor={(v as { name: string }).name}>Default</Label>
            </div>
          ))}
        </RadioGroup>
      );
  }

  return (
    <Input
      type={inputTypeCoerced}
      value={value as string | number | undefined}
      title={title}
      disabled={disabled}
      className={cn(className, "h-8 text-sm border-0 !bg-transparent")}
      placeholder={placeHolderText}
      onChange={(e) => props.handleOnChange(e.target.value)}
      {...extraProps}
    />
  );
};

ShadcnUiValueEditor.displayName = "ShadcnUiValueEditor";
