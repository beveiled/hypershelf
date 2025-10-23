"use client";

import type { Option, OptionList } from "react-querybuilder";
import * as React from "react";
import { Check } from "lucide-react";
import { isOptionGroupArray } from "react-querybuilder";

import { cn } from "@hypershelf/lib/utils";
import { Button } from "@hypershelf/ui/primitives/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@hypershelf/ui/primitives/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@hypershelf/ui/primitives/popover";

export interface MultiSelectProps {
  options?: OptionList<
    Option & {
      icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    }
  >;
  value: string[];
  onValueChange: (value: string[]) => void;
  className?: string;
}

export function MultiSelect({
  options = [],
  value,
  onValueChange,
  className,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (optionName: string) => {
    onValueChange(
      value.includes(optionName)
        ? value.filter((v) => v !== optionName)
        : [...value, optionName],
    );
  };

  const renderOptions = (list: NonNullable<MultiSelectProps["options"]>) => {
    if (isOptionGroupArray(list)) {
      return list.map((og) => (
        <CommandGroup key={og.label} heading={og.label}>
          {og.options.map((opt) => (
            <CommandItem
              key={opt.name}
              value={opt.name}
              disabled={!!opt.disabled}
              onSelect={() => handleSelect(opt.name)}
            >
              {opt.icon && <opt.icon className="h-4 w-4" />}
              {opt.label}
              <Check
                className={cn(
                  "h-4 w-4",
                  value.includes(opt.name) ? "opacity-100" : "opacity-0",
                )}
              />
            </CommandItem>
          ))}
        </CommandGroup>
      ));
    }
    return (
      <CommandGroup>
        {list.map((opt) => (
          <CommandItem
            key={opt.name}
            value={opt.name}
            disabled={!!opt.disabled}
            onSelect={() => handleSelect(opt.name)}
          >
            {opt.icon && <opt.icon className="h-4 w-4" />}
            {opt.label}
            <Check
              className={cn(
                "h-4 w-4",
                value.includes(opt.name) ? "opacity-100" : "opacity-0",
              )}
            />
          </CommandItem>
        ))}
      </CommandGroup>
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "gap-x-1 px-2 py-1 max-w-64 block h-auto whitespace-normal",
            className,
          )}
        >
          {value.length > 0 ? (
            <>
              {value.slice(0, 5).map((it) => (
                <div
                  key={it}
                  className="px-3 py-0.5 text-sm m-0.5 inline-block rounded-sm bg-accent"
                >
                  {it}
                </div>
              ))}
              {value.length > 5 && (
                <div className="px-3 py-0.5 text-sm m-0.5 inline-block rounded-sm bg-accent">
                  +{value.length - 5}
                </div>
              )}
            </>
          ) : (
            "Выбери..."
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-2 z-[99999] w-fit" align="start">
        <Command className="!bg-transparent !backdrop-blur-none">
          <CommandInput placeholder="Поиск..." />
          <CommandList>
            <CommandEmpty>Не нашли ничего</CommandEmpty>
            {renderOptions(options)}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
