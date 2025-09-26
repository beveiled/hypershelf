"use client";

import {
  fieldTypes,
  getPropsForType,
} from "@/components/inventories/fields/fieldTypes";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { IconName } from "@/components/ui/icon-picker";
import { ButtonWithKbd } from "@/components/ui/kbd-button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { FieldType } from "@/convex/schema";
import { cn, shallowPositional } from "@/lib/utils";
import { useHypershelf } from "@/stores";
import { AnimateTransition } from "./fieldTypes/_shared";
import { Check, ChevronDown, Star } from "lucide-react";
import { DynamicIcon } from "lucide-react/dynamic";
import { useCallback, useMemo, useState } from "react";
import { useStoreWithEqualityFn } from "zustand/traditional";

export function FieldTypeProp({
  value,
  onCommit,
  lockField,
  disabled,
  extra,
}: {
  value: string;
  onCommit: (next: string) => void;
  lockField?: () => void;
  disabled: boolean;
  extra: FieldType["extra"];
}) {
  const [pendingType, setPendingType] = useState<string | null>(null);
  const onTypePending = useCallback(
    (next: string | null) => {
      if (next === null) {
        setPendingType(null);
        return;
      }
      const extras = getPropsForType(value);
      const hasExtras = extras.some(k => {
        const v = extra?.[k as keyof typeof extra];
        return Array.isArray(v) ? v.length > 0 : v != null && v !== "";
      });
      if (hasExtras) setPendingType(next);
      else onCommit(next);
    },
    [value, extra, onCommit],
  );
  const nonAllocatedMagicFields = useStoreWithEqualityFn(
    useHypershelf,
    state => {
      const usedFieldTypes = new Set(
        Object.values(state.fields).map(f => f.field.type),
      );
      return fieldTypes
        .filter(ft => ft.magic && !usedFieldTypes.has(ft.key))
        .map(ft => ft.key);
    },
    shallowPositional,
  );
  const renderedFieldTypes = useMemo(() => {
    return [
      ...fieldTypes.filter(
        ft => ft.magic && nonAllocatedMagicFields.includes(ft.key),
      ),
      ...fieldTypes.filter(ft => !ft.magic),
    ];
  }, [nonAllocatedMagicFields]);

  const selectedType = useMemo(
    () => fieldTypes.find(t => t.key === value),
    [value],
  );

  return (
    <div className="relative flex flex-col gap-1">
      <Label className="block text-xs font-medium">Тип</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            disabled={disabled || pendingType !== null}
            onClick={lockField}
          >
            <AnimateTransition postfix="field-type-changer">
              {selectedType ? (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    {selectedType.magic ? (
                      <Star className="text-yellow-400" />
                    ) : (
                      <DynamicIcon name={selectedType.icon as IconName} />
                    )}
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
            value={value}
          >
            <CommandInput
              placeholder="Поиск..."
              className="h-9"
              disabled={disabled || pendingType !== null}
            />
            <CommandList>
              <CommandEmpty>Не нашли ничего</CommandEmpty>
              <CommandGroup>
                {renderedFieldTypes.map(fieldType => (
                  <CommandItem
                    key={fieldType.key}
                    value={fieldType.key}
                    disabled={disabled || pendingType !== null}
                    onSelect={val => onTypePending(val)}
                  >
                    <div className="flex items-center gap-1.5">
                      {fieldType.magic ? (
                        <Star className="text-yellow-400" />
                      ) : (
                        <DynamicIcon name={fieldType.icon as IconName} />
                      )}
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
      {pendingType && (
        <Alert className="absolute top-full z-[51] m-4 flex size-fit flex-col">
          <AlertTitle>Изменить тип поля?</AlertTitle>
          <AlertDescription>
            Изменение типа поля удалит все расширенные настройки.
          </AlertDescription>
          <div className="mt-2 flex items-center gap-2">
            <ButtonWithKbd
              size="sm"
              onClick={() => {
                onCommit(pendingType);
                setPendingType(null);
              }}
              variant="destructive"
              keys={["Meta", "Enter"]}
            >
              Изменить
            </ButtonWithKbd>
            <ButtonWithKbd
              variant="outline"
              size="sm"
              onClick={() => onTypePending(null)}
              keys={["Esc"]}
            >
              Отмена
            </ButtonWithKbd>
          </div>
        </Alert>
      )}
    </div>
  );
}
