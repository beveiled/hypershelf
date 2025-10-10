import { useCallback, useMemo } from "react";
import { Check, ChevronDown } from "lucide-react";
import { DynamicIcon } from "lucide-react/dynamic";

import { cn } from "@hypershelf/lib/utils";

import type { FieldPropArgs, FieldPropConfig } from "./_abstractProp";
import { fieldTypes } from "../fieldTypes";
import { AnimateTransition } from "../fieldTypes/_shared";
import { Button } from "../primitives/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../primitives/command";
import { Label } from "../primitives/label";
import { Popover, PopoverContent, PopoverTrigger } from "../primitives/popover";

function ListObjectTypeProp({
  value,
  setValue,
  label,
  lockField,
  disabled,
}: FieldPropArgs) {
  const handleChange = useCallback((v: string) => setValue(v), [setValue]);

  const selectedType = useMemo(
    () => fieldTypes.find((t) => t.key === value),
    [value],
  );

  return (
    <div className="gap-1 flex flex-col">
      <Label className="text-xs font-medium block">{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            disabled={disabled}
            onClick={lockField}
          >
            <AnimateTransition postfix="field-type-changer">
              {selectedType ? (
                <div className="gap-2 flex items-center">
                  <div className="gap-1.5 flex items-center">
                    <DynamicIcon name={selectedType.icon} />
                    {selectedType.label}
                  </div>
                  <ChevronDown className="opacity-50" />
                </div>
              ) : (
                <span className="text-muted-foreground/50 italic">пусто</span>
              )}
            </AnimateTransition>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-fit">
          <Command
            className="!bg-transparent !backdrop-blur-none"
            value={value?.toString() ?? ""}
          >
            <CommandInput
              placeholder="Поиск..."
              className="h-9"
              disabled={disabled}
            />
            <CommandList>
              <CommandEmpty>Не нашли ничего</CommandEmpty>
              <CommandGroup>
                {fieldTypes
                  .filter((e) =>
                    ["number", "string", "user", "email", "url"].includes(
                      e.key,
                    ),
                  )
                  .map((fieldType) => (
                    <CommandItem
                      key={fieldType.key}
                      value={fieldType.key}
                      disabled={disabled}
                      onSelect={handleChange}
                    >
                      <div className="gap-1.5 flex items-center">
                        <DynamicIcon name={fieldType.icon} />
                        {fieldType.label}
                      </div>
                      <Check
                        className={cn(
                          "ml-auto",
                          value === fieldType.key ? "opacity-100" : "opacity-0",
                        )}
                      />
                    </CommandItem>
                  ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

const config: FieldPropConfig = {
  prop: "listObjectType",
  label: "Тип элементов",
  component: ListObjectTypeProp,
};
export default config;
