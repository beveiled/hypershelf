import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Kbd } from "@/components/ui/kbd";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { useHypershelf } from "@/stores";
import { FieldPropConfig } from "./_abstractType";
import { AnimateTransition } from "./_shared";
import { useMutation } from "convex/react";
import { isEqual } from "lodash";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useStoreWithEqualityFn } from "zustand/traditional";

function InlineSelect({
  assetId,
  fieldId,
  readonly = false,
}: {
  assetId: Id<"assets">;
  fieldId: Id<"fields">;
  readonly?: boolean;
}) {
  const updateAsset = useMutation(api.assets.update);
  const [updating, setUpdating] = useState(false);
  const [open, setOpen] = useState(false);

  const value = useStoreWithEqualityFn(
    useHypershelf,
    state => {
      const curr = state.assets?.[assetId]?.asset?.metadata?.[fieldId] as
        | string
        | string[];
      if (Array.isArray(curr)) return curr;
      if (curr) return [String(curr)];
      return [];
    },
    isEqual,
  );
  const options = useStoreWithEqualityFn(
    useHypershelf,
    state => state.fields?.[fieldId]?.field?.extra?.options || [],
    isEqual,
  );
  const multiselect = useHypershelf(
    state => state.fields?.[fieldId]?.field?.extra?.multiselect || false,
  );

  const lockedBy = useHypershelf(
    state => state.lockedFields[assetId]?.[fieldId],
  );
  const lazyError = useHypershelf(
    state => state.assetErrors?.[assetId]?.[fieldId],
  );
  const disabled = useMemo(() => !!lockedBy || updating, [lockedBy, updating]);

  const onValueChange = useCallback(
    (newValue: string) => {
      setUpdating(true);
      if (!multiselect) {
        setOpen(false);
      }

      const finalValue = multiselect
        ? value.includes(newValue)
          ? value.filter(v => v !== newValue)
          : [...value, newValue]
        : newValue;

      setTimeout(() => {
        updateAsset({
          assetId,
          fieldId,
          value: Array.isArray(finalValue)
            ? finalValue.filter(v => options.includes(v))
            : options.includes(finalValue)
              ? finalValue
              : null,
        }).finally(() => {
          setUpdating(false);
          if (multiselect) {
            const locker = useHypershelf.getState().assetsLocker;
            locker.release(assetId, fieldId);
            locker.acquire(assetId, fieldId);
          } else {
            const locker = useHypershelf.getState().assetsLocker;
            locker.release(assetId, fieldId);
          }
        });
      }, 0);
    },
    [assetId, fieldId, updateAsset, multiselect, value, options],
  );

  const onOpenChange = useCallback(
    (o: boolean) => {
      setOpen(o);
      const locker = useHypershelf.getState().assetsLocker;
      if (!o) {
        locker.release(assetId, fieldId);
      } else {
        locker.acquire(assetId, fieldId);
      }
    },
    [assetId, fieldId],
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

  const displayValue = useMemo(() => {
    if (value.length === 0) {
      return <span className="text-muted-foreground/50 italic">{"пусто"}</span>;
    }
    if (multiselect) {
      return (
        <div className="flex flex-wrap items-center gap-1">
          {value.map(v => (
            <span
              key={v}
              className="bg-muted text-muted-foreground rounded-sm px-1.5 py-0.5 text-xs"
            >
              {v}
            </span>
          ))}
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1.5">
        {value[0]}
        <ChevronDown className="opacity-50" />
      </div>
    );
  }, [value, multiselect]);

  if (readonly) {
    return (
      <div
        className={cn(value.length === 0 && "text-muted-foreground/50 italic")}
      >
        {value.length > 0
          ? multiselect
            ? value.join(", ")
            : value[0]
          : "пусто"}
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
            disabled={!!lockedBy}
            className={cn(
              "h-auto min-h-[2.25rem]",
              lockedBy &&
                "text-foreground/70 ring-brand cursor-not-allowed !opacity-100 ring-2",
              lazyError &&
                !open &&
                "rounded-br-none rounded-bl-none !border-b-2 !border-red-500",
            )}
          >
            {updating && (
              <Loader2 className="animate-spin absolute -translate-x-1/2 left-0 text-muted-foreground" />
            )}
            <AnimateTransition assetId={assetId} fieldId={fieldId}>
              {displayValue}
            </AnimateTransition>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-fit p-0">
          <Command
            className="!bg-transparent !backdrop-blur-none"
            value={multiselect ? "" : value[0]}
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
                      {idx <= 9 && <Kbd keys={["Meta", String(idx + 1)]} />}
                      {option}
                    </div>
                    <Check
                      className={cn(
                        "ml-auto",
                        value.includes(option) ? "opacity-100" : "opacity-0",
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

const config = {
  key: "select",
  label: "Выбор",
  icon: "list-todo",
  fieldProps: ["options", "multiselect"],
  component: InlineSelect,
} as const satisfies FieldPropConfig;

export default config;
