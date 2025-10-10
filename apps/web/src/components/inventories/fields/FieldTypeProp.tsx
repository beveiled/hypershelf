"use client";

import { useCallback, useMemo, useState } from "react";
import { isEqual } from "lodash";
import { Check, ChevronDown, Star } from "lucide-react";
import { DynamicIcon } from "lucide-react/dynamic";
import { useStoreWithEqualityFn } from "zustand/traditional";

import type { FieldType } from "@hypershelf/convex/schema";
import { useHypershelf } from "@hypershelf/lib/stores";
import { cn } from "@hypershelf/lib/utils";
import { fieldTypes, getPropsForType } from "@hypershelf/ui/fieldTypes";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@hypershelf/ui/primitives/alert";
import { Button } from "@hypershelf/ui/primitives/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@hypershelf/ui/primitives/command";
import { ButtonWithKbd } from "@hypershelf/ui/primitives/kbd-button";
import { Label } from "@hypershelf/ui/primitives/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@hypershelf/ui/primitives/popover";

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
  const [open, setOpen] = useState(false);
  const [pendingType, setPendingType] = useState<string | null>(null);
  const onTypePending = useCallback(
    (next: string | null) => {
      if (next === null) {
        setPendingType(null);
        return;
      }
      const extras = getPropsForType(value);
      const hasExtras = extras.some((k) => {
        const v = extra?.[k as keyof typeof extra];
        return Array.isArray(v) ? v.length > 0 : v != null && v !== "";
      });
      if (hasExtras) setPendingType(next);
      else {
        onCommit(next);
        setOpen(false);
      }
    },
    [value, extra, onCommit],
  );
  const nonAllocatedMagicFields = useStoreWithEqualityFn(
    useHypershelf,
    (state) => {
      const usedFieldTypes = new Set(
        Object.values(state.fields).map((f) => f.field.type),
      );
      return fieldTypes
        .filter((ft) => ft.magic && !usedFieldTypes.has(ft.key))
        .map((ft) => ft.key);
    },
    isEqual,
  );
  const renderedFieldTypes = useMemo(() => {
    return [
      ...fieldTypes.filter(
        (ft) => ft.magic && nonAllocatedMagicFields.includes(ft.key),
      ),
      ...fieldTypes.filter((ft) => !ft.magic),
    ];
  }, [nonAllocatedMagicFields]);

  const selectedType = useMemo(
    () => fieldTypes.find((t) => t.key === value),
    [value],
  );

  return (
    <div className="gap-1 relative flex flex-col">
      <Label className="text-xs font-medium block">Тип</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            disabled={disabled || pendingType !== null}
            onClick={lockField}
          >
            {selectedType ? (
              <div className="gap-2 flex items-center">
                <div className="gap-1.5 flex items-center">
                  {selectedType.magic ? (
                    <Star className="text-yellow-400" />
                  ) : (
                    <DynamicIcon name={selectedType.icon} />
                  )}
                  {selectedType.label}
                </div>
                <ChevronDown className="opacity-50" />
              </div>
            ) : (
              <span className="text-muted-foreground/50 italic">пусто</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-fit">
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
                {renderedFieldTypes.map((fieldType) => (
                  <CommandItem
                    key={fieldType.key}
                    value={fieldType.key}
                    disabled={disabled || pendingType !== null}
                    onSelect={(val) => onTypePending(val)}
                  >
                    <div className="gap-1.5 flex items-center">
                      {fieldType.magic ? (
                        <Star className="text-yellow-400" />
                      ) : (
                        <DynamicIcon name={fieldType.icon} />
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
        <Alert className="m-4 absolute top-full z-[51] flex size-fit flex-col">
          <AlertTitle>Изменить тип поля?</AlertTitle>
          <AlertDescription>
            Изменение типа поля удалит все расширенные настройки.
          </AlertDescription>
          <div className="mt-2 gap-2 flex items-center">
            <ButtonWithKbd
              size="sm"
              onClick={() => {
                onCommit(pendingType);
                setOpen(false);
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
