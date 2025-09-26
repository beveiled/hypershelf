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
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { useHypershelf } from "@/stores";
import { FieldPropConfig } from "./_abstractType";
import { AnimateTransition } from "./_shared";
import { useMutation } from "convex/react";
import { Check, Loader2 } from "lucide-react";
import { useState } from "react";

function InlineUser({
  assetId,
  fieldId,
  readonly = false,
}: {
  assetId: Id<"assets">;
  fieldId: Id<"fields">;
  readonly?: boolean;
}) {
  const { placeholder } =
    useHypershelf(state => state.fields?.[fieldId]?.field?.extra || {}) || {};
  const value = useHypershelf(
    state => state.assets?.[assetId]?.asset?.metadata?.[fieldId],
  );
  const lockedBy = useHypershelf(
    state => state.lockedFields?.[assetId]?.[fieldId],
  );
  const users = useHypershelf(state => state.users);

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
        {value ? users[value] || "пусто" : "пусто"}
      </div>
    );
  }

  const handleUserSelect = (selectedUser: string | undefined) => {
    setPopoverOpen(false);
    if (!selectedUser) return;

    const isSame = selectedUser === value;
    if (isSame) return;

    setUpdating(true);
    updateAsset({
      assetId,
      fieldId,
      value: selectedUser,
    }).finally(() => {
      setUpdating(false);
      const locker = useHypershelf.getState().assetsLocker;
      locker.release(assetId, fieldId);
    });
  };

  const handleOpenChange = (open: boolean) => {
    if (updating) return;
    setPopoverOpen(open);
    const locker = useHypershelf.getState().assetsLocker;
    if (open) {
      locker.acquire(assetId, fieldId);
    } else {
      locker.release(assetId, fieldId);
    }
  };

  return (
    <div>
      {lockedBy && (
        <span className="text-brand absolute -mt-0.5 -translate-y-full text-[10px] whitespace-pre">
          {lockedBy}
        </span>
      )}
      <Popover open={popoverOpen} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            role="combobox"
            aria-expanded={!!assetId}
            disabled={!!lockedBy || updating}
            className={cn(
              lockedBy &&
                "text-foreground/70 ring-brand cursor-not-allowed !opacity-100 ring-2",
            )}
          >
            {updating && <Loader2 className="animate-spin" />}
            <AnimateTransition assetId={assetId} fieldId={fieldId}>
              {value ? (
                users[value]
              ) : (
                <span className="text-muted-foreground/50 italic">
                  {placeholder || "пусто"}
                </span>
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

const config: FieldPropConfig = {
  key: "user",
  label: "Юзер",
  icon: "circle-user",
  fieldProps: ["placeholder"],
  component: InlineUser,
};

export default config;
