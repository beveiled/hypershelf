import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectValue
} from "@/components/ui/select";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { useHypershelf } from "@/stores/assets";
import * as SelectPrimitive from "@radix-ui/react-select";
import { useMutation } from "convex/react";
import { ChevronDownIcon, Loader2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { FieldPropConfig } from "./_abstractType";

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
  const options = useHypershelf(
    state => state.fields?.[fieldId]?.extra?.options || []
  );
  const lockedBy = useHypershelf(
    state => state.lockedFields[assetId]?.[fieldId]
  );
  const disabled = useMemo(() => !!lockedBy, [lockedBy]);

  const onValueChange = useCallback(
    (value: string) => {
      setUpdating(true);
      setTimeout(() => {
        updateAsset({
          assetId,
          fieldId,
          value
        })
          .then(() => {
            setUpdating(false);
            const locker = useHypershelf.getState().locker;
            locker.release(assetId, fieldId);
          })
          .finally(() => setUpdating(false));
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
        <span className="text-brand absolute top-0 -mt-0.5 -translate-y-full text-[10px]">
          {lockedBy}
        </span>
      )}
      {/* // TODO: Fix phantom re-renders (hook 22) */}
      <Select
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        open={open}
        onOpenChange={onOpenChange}
      >
        <SelectPrimitive.Trigger asChild>
          <Button
            size="sm"
            variant="ghost"
            className={cn(
              "h-auto w-full py-1",
              lockedBy && "ring-brand ring-2"
            )}
            disabled={!!lockedBy || updating}
          >
            {value && options.includes(String(value)) ? (
              <SelectValue placeholder="Выбери опцию" />
            ) : (
              value
            )}
            {updating ? (
              <Loader2 className="size-4 animate-spin opacity-30" />
            ) : (
              <ChevronDownIcon className="size-4 opacity-30" />
            )}
          </Button>
        </SelectPrimitive.Trigger>
        <SelectContent>
          {options.map(option => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
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
