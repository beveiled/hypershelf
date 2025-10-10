/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unused-vars */
import type { ComponentPropsWithoutRef } from "react";
import type { VersatileSelectorProps } from "react-querybuilder";
import { useMemo, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "@hypershelf/lib/utils";
import { Button } from "@hypershelf/ui/primitives/button";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@hypershelf/ui/primitives/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@hypershelf/ui/primitives/popover";

import { MultiSelect } from "./multiselect";

export type ShadcnUiValueSelectorProps = VersatileSelectorProps &
  ComponentPropsWithoutRef<typeof Command>;

export const ShadcnUiValueSelector = (props: ShadcnUiValueSelectorProps) => {
  const {
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
  } = props;
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
        (opt) =>
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
      onValueChange={(val) => props.handleOnChange(val)}
    />
  ) : (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          role="combobox"
          disabled={disabled}
          size="sm"
          className="px-2 py-1 h-auto"
        >
          {value ? (
            <div className="gap-1.5 flex items-center">
              {label || value}
              <ChevronDown className="opacity-50" />
            </div>
          ) : (
            <span className="text-muted-foreground/50 italic">пусто</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-2 z-[99999] w-fit">
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
            ).map((opt) => (
              <CommandItem
                key={opt.name}
                value={opt.name}
                disabled={!!opt.disabled}
                onSelect={(o) => {
                  props.handleOnChange(
                    typeof o === "string" ? o : (opt.value ?? opt.name),
                  );
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
