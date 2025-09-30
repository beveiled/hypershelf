"use client";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
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
import { Check } from "lucide-react";
import * as React from "react";
import { isOptionGroupArray } from "react-querybuilder";
import type { OptionList } from "react-querybuilder";

export type MultiSelectProps = {
  options?: OptionList;
  value: string[];
  onValueChange: (value: string[]) => void;
  className?: string;
};

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
        ? value.filter(v => v !== optionName)
        : [...value, optionName],
    );
  };

  const renderOptions = (list: OptionList) => {
    if (isOptionGroupArray(list)) {
      return list.map(og => (
        <CommandGroup key={og.label} heading={og.label}>
          {og.options.map(opt => (
            <CommandItem
              key={opt.name}
              value={opt.name}
              disabled={!!opt.disabled}
              onSelect={() => handleSelect(opt.name)}
            >
              <Check
                className={cn(
                  "mr-2 h-4 w-4",
                  value.includes(opt.name) ? "opacity-100" : "opacity-0",
                )}
              />
              {opt.label}
            </CommandItem>
          ))}
        </CommandGroup>
      ));
    }
    return (
      <CommandGroup>
        {list.map(opt => (
          <CommandItem
            key={opt.name}
            value={opt.name}
            disabled={!!opt.disabled}
            onSelect={() => handleSelect(opt.name)}
          >
            <Check
              className={cn(
                "mr-2 h-4 w-4",
                value.includes(opt.name) ? "opacity-100" : "opacity-0",
              )}
            />
            {opt.label}
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
          className={cn("flex gap-x-1 h-auto px-2 py-1", className)}
        >
          {value.length > 0 ? (
            <>
              {value.slice(0, 5).map(it => (
                <div
                  key={it}
                  className="bg-accent rounded-sm px-3 py-0.5 text-sm"
                >
                  {it}
                </div>
              ))}
              {value.length > 5 && (
                <div className="bg-accent rounded-sm px-3 py-0.5 text-sm">
                  +{value.length - 5}
                </div>
              )}
            </>
          ) : (
            "Выбери..."
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-fit p-2 z-[99999]" align="start">
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
