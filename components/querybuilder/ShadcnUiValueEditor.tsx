import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { ValueEditorProps } from "react-querybuilder";
import {
  getFirstOption,
  standardClassnames,
  useValueEditor,
} from "react-querybuilder";

export type ShadcnUiValueEditorProps = ValueEditorProps & {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  extraProps?: Record<string, any>;
};

export const ShadcnUiValueEditor = (allProps: ShadcnUiValueEditorProps) => {
  const {
    fieldData,
    operator,
    value,
    handleOnChange,
    title,
    className,
    type,
    inputType,
    values = [],
    listsAsArrays,
    parseNumbers,
    separator,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    valueSource: _vs,
    testID,
    disabled,
    selectorComponent: SelectorComponent = allProps.schema.controls
      .valueSelector,
    extraProps,
    ...props
  } = allProps;

  const { valueAsArray, multiValueHandler } = useValueEditor({
    ...allProps,
    handleOnChange,
    inputType,
    operator,
    value,
    type,
    listsAsArrays,
    parseNumbers,
    values,
  });

  if (operator === "null" || operator === "notNull") {
    return null;
  }

  const placeHolderText = fieldData?.placeholder ?? "";
  const inputTypeCoerced = ["in", "notIn"].includes(operator)
    ? "text"
    : inputType || "text";

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
            className={cn(standardClassnames.valueListItem, "text-sm")}
            placeholder={placeHolderText}
            onChange={e => multiValueHandler(e.target.value, i)}
            {...extraProps}
          />
        );
      }
      return (
        <SelectorComponent
          {...props}
          key={key}
          className={standardClassnames.valueListItem}
          handleOnChange={v => multiValueHandler(v, i)}
          disabled={disabled}
          value={valueAsArray[i] ?? getFirstOption(values)}
          options={values}
          listsAsArrays={listsAsArrays}
        />
      );
    });
    return (
      <span
        data-testid={testID}
        className={cn("flex space-x-2", className)}
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
          value={value}
          disabled={disabled}
          handleOnChange={handleOnChange}
          options={values}
        />
      );

    case "multiselect":
      return (
        <SelectorComponent
          {...props}
          className={className}
          title={title}
          value={value}
          disabled={disabled}
          handleOnChange={handleOnChange}
          options={values}
          multiple
        />
      );

    case "textarea":
      return (
        <Textarea
          value={value}
          title={title}
          rows={2}
          disabled={disabled}
          className={cn("min-h-0", className)}
          placeholder={placeHolderText}
          onChange={e => handleOnChange(e.target.value)}
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
          onCheckedChange={handleOnChange}
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
          onCheckedChange={handleOnChange}
          checked={!!value}
          {...extraProps}
        />
      );

    case "radio":
      return (
        <RadioGroup
          className={cn("flex items-center space-x-2", className)}
          title={title}
          value={value}
          onValueChange={handleOnChange}
          disabled={disabled}
          {...extraProps}
        >
          {values.map(v => (
            <div key={v.name} className="flex items-center space-x-2">
              <RadioGroupItem value={v.name} id={v.name} />
              <Label htmlFor={v.name}>Default</Label>
            </div>
          ))}
        </RadioGroup>
      );
  }

  return (
    <Input
      type={inputTypeCoerced}
      value={value}
      title={title}
      disabled={disabled}
      className={cn(className, "h-8 text-sm")}
      placeholder={placeHolderText}
      onChange={e => handleOnChange(e.target.value)}
      {...extraProps}
    />
  );
};

ShadcnUiValueEditor.displayName = "ShadcnUiValueEditor";
