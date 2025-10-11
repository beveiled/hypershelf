import type { IconName } from "lucide-react/dynamic";
import { useMemo } from "react";
import { useQuery } from "convex/react";
import { DynamicIcon } from "lucide-react/dynamic";

import { api } from "@hypershelf/convex/_generated/api";
import { FieldRenderer } from "@hypershelf/ui";

const Inner = ({ hostname }: { hostname: string | null }) => {
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
    return (
      <div className="px-4 flex h-full w-full flex-col items-center justify-center text-center">
        <div className="text-4xl font-bold relative font-title text-foreground">
          404
          <div className="bottom-0 left-0 right-0 h-1 w-5 absolute mx-auto overflow-hidden">
            <div className="h-full w-full bg-brand" />
          </div>
        </div>
        <div className="mt-2 text-sm font-medium text-muted-foreground">
          Этого хоста нет в Hypershelf.
        </div>
      </div>
    );
  }

  if (!fields || !asset) {
    return (
      <div className="group text-3xl font-extrabold relative font-title text-foreground select-none">
        Hypershelf
        <div className="bottom-0 left-0 h-1 w-9 absolute overflow-hidden">
          <div className="h-full w-full animate-brand-load bg-brand" />
        </div>
      </div>
    );
  }

  return (
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
  );
};

export const BlockWidget = ({ hostname }: { hostname: string | null }) => {
  return (
    <div className="h-38 mb-3 flex items-center justify-center rounded-md border-2 border-brand bg-background font-sans">
      <Inner hostname={hostname} />
    </div>
  );
};
