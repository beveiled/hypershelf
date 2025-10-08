import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContentNoPortal,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import VSphereIcon from "@/lib/icons/VSphereIcon";
import { cn } from "@/lib/utils";
import { useHypershelf } from "@/stores";
import { FieldPropConfig } from "./_abstractType";
import { InlineString } from "./string";
import { useMutation } from "convex/react";
import { formatDistanceToNowStrict } from "date-fns";
import { ru } from "date-fns/locale";
import { isEqual } from "lodash";
import { Clock } from "lucide-react";
import { useStoreWithEqualityFn } from "zustand/traditional";

function InlineHostnameStatus({
  assetId,
  fieldId,
}: {
  assetId: Id<"assets">;
  fieldId: Id<"fields">;
}) {
  const vsphereStatus = useStoreWithEqualityFn(
    useHypershelf,
    state => {
      const asset = state.assets?.[assetId]?.asset;
      if (!asset) return { status: "not_found" };
      const vsphereHostname = asset.vsphereMetadata?.magic__hostname;
      const vsphereIp = asset.vsphereMetadata?.magic__ip;
      const assetHostname = asset.metadata?.[fieldId];
      const ipFieldId = Object.values(state.fields ?? {}).find(
        f => f.field.type === "magic__ip",
      )?.field?._id;
      const assetIp = ipFieldId ? asset.metadata?.[ipFieldId] : null;
      if (!assetHostname || !assetIp) return { status: "none" };
      if (!asset.vsphereLastSync) return { status: "not_synced" };
      if (!vsphereHostname) return { status: "not_found" };
      if (
        asset.vsphereMetadata?.system__cache_key !==
        `${assetHostname}-${assetIp}`
      )
        return { status: "not_synced" };
      if (vsphereHostname === assetHostname && vsphereIp === assetIp)
        return { status: "matched" };
      return {
        status: "mismatched",
        vsphereHostname,
        vsphereIp,
        hostnameMatched: vsphereHostname === assetHostname,
        ipMatched: vsphereIp === assetIp,
      };
    },
    isEqual,
  );
  const vsphereLastSync = useHypershelf(
    state => state.assets?.[assetId]?.asset?.vsphereLastSync,
  );
  const requestRefetch = useMutation(api.vsphere.requestRefetch);

  if (vsphereStatus.status === "none") return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="absolute top-1 right-1 text-[10px] text-muted-foreground">
          {vsphereStatus.status === "matched" ? (
            <VSphereIcon className="size-4" colored={true} />
          ) : vsphereStatus.status === "mismatched" ? (
            <VSphereIcon className="size-4 text-red-500" />
          ) : vsphereStatus.status === "not_found" ? (
            <VSphereIcon className="size-4 text-yellow-500" />
          ) : (
            <Clock className="size-3 text-muted-foreground" />
          )}
        </div>
      </TooltipTrigger>
      <TooltipContentNoPortal
        className="z-[9999] px-3 py-2 rounded-md whitespace-pre"
        side="right"
      >
        <div>
          Последняя проверка:{" "}
          {vsphereLastSync
            ? formatDistanceToNowStrict(new Date(vsphereLastSync), {
                addSuffix: true,
                locale: ru,
              })
            : "никогда"}
        </div>
        <div>
          {vsphereStatus.status === "matched" ? (
            <span className="text-green-500">Данные совпадают со сферой</span>
          ) : vsphereStatus.status === "mismatched" ? (
            <span className="text-red-500">Данные не совпадают со сферой</span>
          ) : vsphereStatus.status === "not_found" ? (
            <span className="text-yellow-500">Не найден в сфере</span>
          ) : (
            "Ожидает перепроверки"
          )}
          {vsphereStatus.status === "mismatched" && (
            <div className="pt-1 mt-1 border-t border-border">
              <div className="font-bold">Информация со сферы</div>
              <div className="flex items-center gap-1">
                <div className="font-semibold">Хостнейм:</div>
                <div
                  className={cn(
                    vsphereStatus.hostnameMatched
                      ? "text-green-500"
                      : "font-bold text-red-500",
                  )}
                >
                  {vsphereStatus.vsphereHostname}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <div className="font-semibold">IP:</div>
                <div
                  className={cn(
                    vsphereStatus.ipMatched
                      ? "text-green-500"
                      : "font-bold text-red-500",
                  )}
                >
                  {vsphereStatus.vsphereIp || "Неизвестен"}
                </div>
              </div>
            </div>
          )}
          {vsphereStatus.status !== "not_synced" && (
            <div className="mt-2">
              <Button
                className="text-xs h-auto py-1"
                size="sm"
                variant="outline"
                onClick={() => requestRefetch({ id: assetId })}
              >
                Запросить повторную проверку
              </Button>
            </div>
          )}
        </div>
      </TooltipContentNoPortal>
    </Tooltip>
  );
}

function InlineHostname({
  assetId,
  fieldId,
  readonly,
}: {
  assetId: Id<"assets">;
  fieldId: Id<"fields">;
  readonly?: boolean;
}) {
  if (readonly) {
    return (
      <InlineString
        assetId={assetId}
        fieldId={fieldId}
        maxRows={1}
        readonly={readonly}
      />
    );
  }

  return (
    <div className="px-2">
      <InlineHostnameStatus assetId={assetId} fieldId={fieldId} />
      <InlineString
        assetId={assetId}
        fieldId={fieldId}
        maxRows={1}
        readonly={readonly}
      />
    </div>
  );
}

const config = {
  key: "magic__hostname",
  label: "Хостнейм",
  icon: "globe",
  fieldProps: ["placeholder", "regex", "regexError"],
  magic: true,
  component: InlineHostname,
} as const satisfies FieldPropConfig;

export default config;
