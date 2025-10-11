import type { IconName } from "lucide-react/dynamic";
import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { DynamicIcon } from "lucide-react/dynamic";

import { api } from "@hypershelf/convex/_generated/api";
import { cn } from "@hypershelf/lib/utils";
import { FieldRenderer } from "@hypershelf/ui";
import { HypershelfIcon } from "@hypershelf/ui/icons";
import { Button } from "@hypershelf/ui/primitives/button";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@hypershelf/ui/primitives/popover";

export const PopoverWidget = ({ hostname }: { hostname: string | null }) => {
  const [open, setOpen] = useState(false);
  const fields = useQuery(api.fields.get, {});
  const assets = useQuery(api.assets.get, {});
  const asset = useMemo(() => {
    if (!fields || !assets) return null;
    const hostField = fields.fields.find(
      (f) => f.field.type === "magic__hostname",
    );
    if (!hostField) return null;
    const fid = hostField.field._id;
    const row = assets.assets.find((a) => a.asset.metadata?.[fid] === hostname);
    return row ?? null;
  }, [fields, assets, hostname]);

  const notFound = useMemo(() => {
    if (!fields || !assets || !hostname) return false;
    const hostField = fields.fields.find(
      (f) => f.field.type === "magic__hostname",
    );
    if (!hostField) return false;
    const fid = hostField.field._id;
    if (assets.assets.length === 0) return false;
    const row = assets.assets.find((a) => a.asset.metadata?.[fid] === hostname);
    return row === undefined;
  }, [fields, assets, hostname]);

  if (notFound) {
    return <HypershelfIcon className="text-red-500 size-6 p-1" />;
  }

  return (
    <Popover open={open} onOpenChange={() => null}>
      <PopoverAnchor asChild>
        <Button
          disabled={!fields || !asset}
          variant="ghost"
          size="sm"
          onClick={() => setOpen(!open)}
          className="!p-1 group relative size-auto"
        >
          <HypershelfIcon
            className={cn(
              "ease-out size-4 transition-colors duration-150 hover:text-brand",
              open && "text-brand",
            )}
          />
          <div className="inset-1 pointer-events-none absolute overflow-hidden">
            <div
              className={cn(
                "bottom-0 left-0 w-4 h-0.5 ease-out absolute origin-left scale-x-0 rounded-[1px] bg-brand transition-transform duration-100",
                !open && fields && asset && "group-hover:scale-x-100",
                (!fields || !asset) && "scale-x-100 animate-load",
              )}
            />
          </div>
        </Button>
      </PopoverAnchor>
      <PopoverContent
        side="right"
        align="start"
        className="min-w-32 max-w-lg max-h-64 p-2 w-fit overflow-y-auto"
      >
        {fields && asset && (
          <div className="h-full w-full">
            <div className="gap-1 text-xs no-scrollbar p-2 flex h-full w-full flex-col overflow-scroll">
              {fields.fields.map(({ field }) => {
                if (!asset.asset.metadata || field.hidden) return null;
                return (
                  <div
                    key={field._id}
                    className="gap-1 px-2 py-1 text-sm flex items-center rounded-md border border-border text-foreground"
                  >
                    <DynamicIcon
                      name={(field.extra?.icon ?? "circle") as IconName}
                      className="size-3.5 text-muted-foreground"
                    />
                    <div className="font-medium text-muted-foreground">
                      {field.name}:
                    </div>{" "}
                    <FieldRenderer
                      assetId={asset.asset._id}
                      fieldId={field._id}
                      readonly={true}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
