import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

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
    state => state.fields?.[fieldId]?.field?.extra?.placeholder,
  );
  const value = useHypershelf(
    state => state.assets?.[assetId]?.asset?.metadata?.[fieldId],
  );
  const lockedBy = useHypershelf(
    state => state.lockedFields?.[assetId]?.[fieldId],
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

    const isSame = selectedDate?.toISOString() === initialDate?.toISOString();
    if (isSame) return;

    setDate(selectedDate);
    setUpdating(true);
    updateAsset({
      assetId,
      fieldId,
      value: selectedDate.toISOString(),
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
      setDate(initialDate);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {lockedBy && (
        <span className="text-brand absolute -mt-0.5 -translate-y-full text-[10px] whitespace-pre">
          {lockedBy}
        </span>
      )}
      <Popover open={popoverOpen} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "h-auto w-full justify-start !border-none !bg-transparent py-1 text-left text-sm font-normal",
              !date && "text-muted-foreground",
              updating && "animate-pulse opacity-50",
              lockedBy &&
                "text-foreground/70 ring-brand cursor-not-allowed !opacity-100 ring-2",
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
                  {placeholder || "пусто"}
                </span>
              )}
            </AnimateTransition>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            month={month}
            onMonthChange={setMonth}
            locale={ru}
            captionLayout="dropdown"
          />
          <div className="border-t p-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-auto w-full py-1 text-sm"
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
