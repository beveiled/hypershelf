import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { fieldTypes } from "../fieldTypes";
import { AnimateTransition } from "../fieldTypes/_shared";
import { FieldPropArgs, FieldPropConfig } from "./_abstractProp";
import { Check, ChevronDown } from "lucide-react";
import { DynamicIcon, IconName } from "lucide-react/dynamic";
import { useCallback, useMemo } from "react";

function ListObjectTypeProp({
  prop,
  value,
  label,
  lockField,
  isLockedBySomeoneElse,
  change,
}: FieldPropArgs) {
  const handleChange = useCallback(
    (v: string) => {
      change(prop, v);
    },
    [change, prop],
  );

  const selectedType = useMemo(
    () => fieldTypes.find(t => t.key === value),
    [value],
  );

  return (
    <div className="flex flex-col gap-1">
      <Label className="block text-xs font-medium">{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            disabled={isLockedBySomeoneElse}
            onClick={lockField}
          >
            <AnimateTransition postfix="field-type-changer">
              {selectedType ? (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <DynamicIcon name={selectedType.icon as IconName} />
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
        <PopoverContent className="w-fit p-0">
          <Command
            className="!bg-transparent !backdrop-blur-none"
            value={value?.toString() || ""}
          >
            <CommandInput
              placeholder="Поиск..."
              className="h-9"
              disabled={isLockedBySomeoneElse}
            />
            <CommandList>
              <CommandEmpty>Не нашли ничего</CommandEmpty>
              <CommandGroup>
                {fieldTypes
                  .filter(e =>
                    ["number", "string", "user", "email", "url"].includes(
                      e.key,
                    ),
                  )
                  .map(fieldType => (
                    <CommandItem
                      key={fieldType.key}
                      value={fieldType.key}
                      disabled={isLockedBySomeoneElse}
                      onSelect={handleChange}
                    >
                      <div className="flex items-center gap-1.5">
                        <DynamicIcon name={fieldType.icon as IconName} />
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
