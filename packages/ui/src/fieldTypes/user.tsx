import { useState } from "react";
import { useMutation } from "convex/react";
import { isEqual } from "lodash";
import { Check, Loader2 } from "lucide-react";
import { useStoreWithEqualityFn } from "zustand/traditional";

import type { Id } from "@hypershelf/convex/_generated/dataModel";
import { api } from "@hypershelf/convex/_generated/api";
import { useHypershelf } from "@hypershelf/lib/stores";
import { cn } from "@hypershelf/lib/utils";

import type { FieldPropConfig } from "./_abstractType";
import { Button } from "../primitives/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../primitives/command";
import { Popover, PopoverContent, PopoverTrigger } from "../primitives/popover";
import { AnimateTransition } from "./_shared";

function InlineUser({
  assetId,
  fieldId,
  readonly = false,
}: {
  assetId: Id<"assets">;
  fieldId: Id<"fields">;
  readonly?: boolean;
}) {
  const placeholder = useHypershelf(
    (state) => state.fields[fieldId]?.field.extra?.placeholder,
  );
  const value = useHypershelf(
    (state) =>
      state.assets[assetId]?.asset.metadata?.[fieldId] as
        | Id<"users">
        | undefined,
  );
  const lockedBy = useHypershelf(
    (state) => state.lockedFields[assetId]?.[fieldId],
  );
  const users = useStoreWithEqualityFn(
    useHypershelf,
    (state) => state.users,
    isEqual,
  );

  const [updating, setUpdating] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const updateAsset = useMutation(api.assets.update);

  if (readonly) {
    return (
      <div
        className={cn(
          (!value || !users[value]) && "text-muted-foreground/50 italic",
        )}
      >
        {value ? (users[value] ?? "пусто") : "пусто"}
      </div>
    );
  }

  const handleUserSelect = (selectedUser: string | undefined) => {
    setPopoverOpen(false);
    if (!selectedUser) return;

    const isSame = selectedUser === value;
    if (isSame) return;

    setUpdating(true);
    void updateAsset({
      assetId,
      fieldId,
      value: selectedUser,
    }).finally(() => {
      setUpdating(false);
      const locker = useHypershelf.getState().assetsLocker;
      void locker.release(assetId, fieldId);
    });
  };

  const handleOpenChange = (open: boolean) => {
    if (updating) return;
    setPopoverOpen(open);
    const locker = useHypershelf.getState().assetsLocker;
    if (open) {
      void locker.acquire(assetId, fieldId);
    } else {
      void locker.release(assetId, fieldId);
    }
  };

  return (
    <div>
      {lockedBy && (
        <span className="-mt-0.5 absolute -translate-y-full text-[10px] whitespace-pre text-brand">
          {lockedBy}
        </span>
      )}
      <Popover open={popoverOpen} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            role="combobox"
            aria-expanded={!!assetId}
            disabled={!!lockedBy || updating}
            className={cn(
              lockedBy &&
                "cursor-not-allowed text-foreground/70 !opacity-100 ring-2 ring-brand",
            )}
          >
            {updating && <Loader2 className="animate-spin" />}
            <AnimateTransition assetId={assetId} fieldId={fieldId}>
              {value ? (
                users[value]
              ) : (
                <span className="text-muted-foreground/50 italic">
                  {placeholder ?? "пусто"}
                </span>
              )}
            </AnimateTransition>
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
              disabled={!!lockedBy || updating}
            />
            <CommandList>
              <CommandEmpty>Не нашли никого</CommandEmpty>
              <CommandGroup>
                {Object.entries(users).map(([id, email]) => {
                  return (
                    <CommandItem
                      key={id}
                      value={id}
                      keywords={[email]}
                      onSelect={handleUserSelect}
                      disabled={!!lockedBy || updating}
                    >
                      {email}
                      <Check
                        className={cn(
                          "ml-auto",
                          value === id ? "opacity-100" : "opacity-0",
                        )}
                      />
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

const config = {
  key: "user",
  label: "Юзер",
  icon: "circle-user",
  fieldProps: ["placeholder"],
  component: InlineUser,
} as const satisfies FieldPropConfig;

export default config;
