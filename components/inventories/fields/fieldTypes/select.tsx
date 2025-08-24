/*
https://github.com/beveiled/hypershelf
Copyright (C) 2025  Daniil Gazizullin

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import { Kbd } from "@/components/ui/kbd";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { cn, shallowPositional } from "@/lib/utils";
import { useHypershelf } from "@/stores/assets";
import { useMutation } from "convex/react";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useStoreWithEqualityFn } from "zustand/traditional";
import { FieldPropConfig } from "./_abstractType";
import { AnimateTransition } from "./string";

function InlineSelect({
  assetId,
  fieldId,
  readonly = false
}: {
  assetId: Id<"assets">;
  fieldId: Id<"fields">;
  readonly?: boolean;
}) {
  const updateAsset = useMutation(api.assets.update);
  const [updating, setUpdating] = useState(false);
  const [open, setOpen] = useState(false);

  const value = useHypershelf(state =>
    String(state.assets?.[assetId]?.asset?.metadata?.[fieldId])
  );
  const options = useStoreWithEqualityFn(
    useHypershelf,
    state => state.fields?.[fieldId]?.extra?.options || [],
    shallowPositional
  );
  const lockedBy = useHypershelf(
    state => state.lockedFields[assetId]?.[fieldId]
  );
  const lazyError = useHypershelf(
    state => state.assetErrors?.[assetId]?.[fieldId]
  );
  const disabled = useMemo(() => !!lockedBy || updating, [lockedBy, updating]);

  const onValueChange = useCallback(
    (value: string) => {
      setUpdating(true);
      setOpen(false);
      setTimeout(() => {
        updateAsset({
          assetId,
          fieldId,
          value
        }).finally(() => {
          setUpdating(false);
          const locker = useHypershelf.getState().locker;
          locker.release(assetId, fieldId);
        });
      }, 0);
    },
    [assetId, fieldId, updateAsset]
  );

  const onOpenChange = useCallback(
    (o: boolean) => {
      setOpen(o);
      const locker = useHypershelf.getState().locker;
      if (!o) {
        locker.release(assetId, fieldId);
      } else {
        locker.acquire(assetId, fieldId);
      }
    },
    [assetId, fieldId]
  );

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      const idx = Number(e.key);
      if ((e.ctrlKey || e.metaKey) && idx >= 0 && idx <= 9) {
        e.preventDefault();
        const option = options[idx - 1];
        if (option && !disabled) {
          onValueChange(option);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, assetId, fieldId, options, onValueChange, disabled]);

  if (readonly) {
    return (
      <div
        className={cn(
          "select-none",
          !value && "text-muted-foreground/50 italic"
        )}
      >
        {value || "пусто"}
      </div>
    );
  }

  return (
    <div className="relative">
      {lockedBy && (
        <span className="text-brand absolute top-0 -mt-0.5 -translate-y-full text-[10px] whitespace-pre">
          {lockedBy}
        </span>
      )}
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            role="combobox"
            aria-expanded={!!assetId}
            disabled={!!lockedBy || updating}
            className={cn(
              lockedBy &&
                "text-foreground/70 ring-brand cursor-not-allowed !opacity-100 ring-2",
              lazyError &&
                !open &&
                "rounded-br-none rounded-bl-none !border-b-2 border-red-500"
            )}
          >
            {updating && <Loader2 className="animate-spin" />}
            <AnimateTransition assetId={assetId} fieldId={fieldId}>
              {value ? (
                <div className="flex items-center gap-1.5">
                  {value}
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
              disabled={disabled}
            />
            <CommandList>
              <CommandEmpty>Не нашли ничего</CommandEmpty>
              <CommandGroup>
                {options.map((option, idx) => (
                  <CommandItem
                    key={option}
                    value={option}
                    onSelect={onValueChange}
                    disabled={disabled}
                  >
                    <div className="flex items-center gap-1.5">
                      {idx <= 10 && <Kbd keys={["Meta", String(idx + 1)]} />}
                      {option}
                    </div>
                    <Check
                      className={cn(
                        "ml-auto",
                        value === option ? "opacity-100" : "opacity-0"
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
  key: "select",
  label: "Выбор",
  icon: "list-todo",
  fieldProps: ["options"],
  component: InlineSelect
};

export default config;
