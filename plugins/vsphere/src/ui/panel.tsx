import { FieldRenderer } from "@/components/inventories/assets/table-view/FieldRenderer";
import { api } from "@/convex/_generated/api";
import "./mount.css";
import { ConvexReactClient, useQuery } from "convex/react";
import { DynamicIcon, IconName } from "lucide-react/dynamic";
import { useMemo } from "react";

export const Panel = ({
  hostname,
}: {
  hostname: string | null;
  convex: ConvexReactClient;
}) => {
  const fields = useQuery(api.fields.get, {});
  const assets = useQuery(api.assets.get, {});
  const asset = useMemo(() => {
    if (!fields || !assets) return null;
    const hostField = fields.fields.find(
      f => f.field.type === "magic__hostname",
    );
    if (!hostField) return null;
    const fid = hostField.field._id;
    const row = assets.assets.find(a => a.asset.metadata?.[fid] === hostname);
    return row ?? null;
  }, [fields, assets, hostname]);

  const notFound = useMemo(() => {
    if (!fields || !assets) return false;
    const hostField = fields.fields.find(
      f => f.field.type === "magic__hostname",
    );
    if (!hostField) return false;
    const fid = hostField.field._id;
    const row = assets.assets.find(a => a.asset.metadata?.[fid] === hostname);
    return row === undefined;
  }, [fields, assets, hostname]);

  if (notFound) {
    return (
      <div
        id="hypershelf-root"
        className="flex h-full w-full flex-col items-center justify-center text-center px-4"
      >
        <div className="text-4xl font-bold font-title text-foreground relative">
          404
          <div className="absolute bottom-0 left-0 right-0 mx-auto h-1 w-5 overflow-hidden">
            <div className="bg-brand h-full w-full" />
          </div>
        </div>
        <div className="mt-2 text-sm text-muted-foreground font-medium">
          Этого хоста нет в Hypershelf.
        </div>
      </div>
    );
  }

  if (!fields || !asset) {
    return (
      <div
        id="hypershelf-root"
        className="font-title group relative text-3xl font-extrabold select-none text-foreground"
      >
        Hypershelf
        <div className="absolute bottom-0 left-0 h-1 w-9 overflow-hidden">
          <div className="bg-brand h-full w-full animate-brand-load" />
        </div>
      </div>
    );
  }

  return (
    <div id="hypershelf-root" className="h-full w-full">
      <div className="flex flex-col gap-1 text-xs overflow-scroll no-scrollbar h-full w-full p-2">
        {fields!.fields.map(({ field }) => {
          if (!asset.asset.metadata || field.hidden) return null;
          return (
            <div
              key={field._id}
              className="text-foreground border-border flex items-center gap-1 rounded-md border px-2 py-1 text-sm"
            >
              <DynamicIcon
                name={(field.extra?.icon || "circle") as IconName}
                className="size-3 text-muted-foreground"
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
