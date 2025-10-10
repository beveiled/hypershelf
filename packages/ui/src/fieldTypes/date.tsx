import { useEffect, useMemo, useState } from "react";
import { useMutation } from "convex/react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Loader2 } from "lucide-react";

import type { Id } from "@hypershelf/convex/_generated/dataModel";
import { api } from "@hypershelf/convex/_generated/api";
import { useHypershelf } from "@hypershelf/lib/stores";
import { cn } from "@hypershelf/lib/utils";

import type { FieldPropConfig } from "./_abstractType";
import { Button } from "../primitives/button";
import { Calendar } from "../primitives/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../primitives/popover";
import { AnimateTransition } from "./_shared";

function InlineDate({
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
    (state) => state.assets[assetId]?.asset.metadata?.[fieldId],
  );
  const lockedBy = useHypershelf(
    (state) => state.lockedFields[assetId]?.[fieldId],
  );

  const initialDate = useMemo(
    () => (value ? new Date(String(value)) : undefined),
    [value],
  );

  const [date, setDate] = useState<Date | undefined>(initialDate);
  const [month, setMonth] = useState<Date | undefined>(
    initialDate
      ? new Date(initialDate.getFullYear(), initialDate.getMonth())
      : undefined,
  );
  const [updating, setUpdating] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);

  useEffect(() => {
    setDate(initialDate);
  }, [initialDate]);

  const updateAsset = useMutation(api.assets.update);

  if (readonly) {
    return (
      <div className={cn(!date && "text-muted-foreground/50 italic")}>
        {date ? format(date, "PPP", { locale: ru }) : "пусто"}
      </div>
    );
  }

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setPopoverOpen(false);
    if (!selectedDate) return;

    const isSame = selectedDate.toISOString() === initialDate?.toISOString();
    if (isSame) return;

    setDate(selectedDate);
    setUpdating(true);
    void updateAsset({
      assetId,
      fieldId,
      value: selectedDate.toISOString(),
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
      setDate(initialDate);
    }
  };

  return (
    <div className="gap-2 flex flex-col">
      {lockedBy && (
        <span className="-mt-0.5 absolute -translate-y-full text-[10px] whitespace-pre text-brand">
          {lockedBy}
        </span>
      )}
      <Popover open={popoverOpen} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "py-1 text-sm font-normal h-auto w-full justify-start !border-none !bg-transparent text-left",
              !date && "text-muted-foreground",
              updating && "animate-pulse opacity-50",
              lockedBy &&
                "cursor-not-allowed text-foreground/70 !opacity-100 ring-2 ring-brand",
            )}
            disabled={updating || !!lockedBy}
          >
            {updating && <Loader2 className="animate-spin" />}
            <AnimateTransition assetId={assetId} fieldId={fieldId}>
              {date ? (
                format(
                  date,
                  date.getFullYear() === new Date().getFullYear()
                    ? "d MMMM"
                    : "PPP",
                  {
                    locale: ru,
                  },
                )
              ) : (
                <span className="text-muted-foreground/50 italic">
                  {placeholder ?? "пусто"}
                </span>
              )}
            </AnimateTransition>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-auto">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            month={month}
            onMonthChange={setMonth}
            locale={ru}
            captionLayout="dropdown"
          />
          <div className="p-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              className="py-1 text-sm h-auto w-full"
              onClick={() => handleOpenChange(false)}
            >
              Отменить
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

const config = {
  key: "date",
  label: "Дата",
  icon: "calendar",
  fieldProps: ["placeholder"],
  component: InlineDate,
} as const satisfies FieldPropConfig;

export default config;
