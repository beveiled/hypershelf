/* eslint-disable @typescript-eslint/no-unused-vars */
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { MultiSelect } from "./multiselect";
import { Check, ChevronDown } from "lucide-react";
import { type ComponentPropsWithoutRef, useMemo, useState } from "react";
import { type VersatileSelectorProps } from "react-querybuilder";

export type ShadcnUiValueSelectorProps = VersatileSelectorProps &
  ComponentPropsWithoutRef<typeof Command>;

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
  const [open, setOpen] = useState(false);
  const label = useMemo(() => {
    if (Array.isArray(options)) {
      const match = (
        options as {
          name: string;
          value?: string;
          label: string;
          disabled?: boolean;
        }[]
      ).find(
        opt =>
          (typeof opt === "string" ? opt : (opt.value ?? opt.name)) === value,
      );
      return typeof match === "string" ? match : (match?.label ?? value ?? "");
    }
    return value ?? "";
  }, [options, value]);

  return _multiple ? (
    <MultiSelect
      options={options}
      value={value as unknown as string[]}
      onValueChange={handleOnChange}
    />
  ) : (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          role="combobox"
          disabled={disabled}
          size="sm"
          className="h-auto px-2 py-1"
        >
          {value ? (
            <div className="flex items-center gap-1.5">
              {label || value}
              <ChevronDown className="opacity-50" />
            </div>
          ) : (
            <span className="text-muted-foreground/50 italic">пусто</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-fit p-2 z-[99999]">
        <Command
          className="!bg-transparent !backdrop-blur-none"
          value={value}
          {...extraProps}
        >
          {options.length > 10 && (
            <CommandInput
              placeholder="Поиск..."
              className="h-9"
              disabled={disabled}
            />
          )}
          <CommandList>
            <CommandEmpty>Не нашли ничего</CommandEmpty>
            {(
              options as {
                name: string;
                value?: string;
                label: string;
                disabled?: boolean;
              }[]
            ).map(opt => (
              <CommandItem
                key={opt.name}
                value={opt.name ?? ""}
                disabled={!!opt.disabled}
                onSelect={o => {
                  handleOnChange(o);
                  setOpen(false);
                }}
              >
                {opt.label}
                <Check
                  className={cn(
                    "ml-auto",
                    value === opt.value ? "opacity-100" : "opacity-0",
                  )}
                />
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

ShadcnUiValueSelector.displayName = "ShadcnUiValueSelector";
