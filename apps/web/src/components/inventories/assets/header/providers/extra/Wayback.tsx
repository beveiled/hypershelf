import type { FunctionReturnType } from "convex/server";
import type { IconName } from "lucide-react/dynamic";
import type { ReactNode } from "react";
import { useMemo, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useQuery } from "convex/react";
import { AnimatePresence, motion } from "framer-motion";
import { isEqual } from "lodash";
import {
  Archive,
  ArchiveRestore,
  ArrowRight,
  History,
  PlusCircle,
  SquarePen,
} from "lucide-react";
import { DynamicIcon } from "lucide-react/dynamic";
import { useStoreWithEqualityFn } from "zustand/traditional";

import type { Id } from "@hypershelf/convex/_generated/dataModel";
import type { AssetType, FieldType } from "@hypershelf/convex/schema";
import type { MagicFieldTypes } from "@hypershelf/lib/stores/types";
import type { PlainFieldTypes } from "@hypershelf/ui/fieldTypes";
import { api } from "@hypershelf/convex/_generated/api";
import { useHypershelf } from "@hypershelf/lib/stores";
import { fieldProps } from "@hypershelf/ui/fieldProps";
import { fieldTypesMap } from "@hypershelf/ui/fieldTypes";
import { Button } from "@hypershelf/ui/primitives/button";

function Code({ children }: { children: React.ReactNode }) {
  return <span className="rounded px-1 bg-muted font-mono">{children}</span>;
}

function waybackRevert({
  assets,
  fields,
  action,
}: {
  assets: Record<Id<"assets">, AssetType>;
  fields: Record<Id<"fields">, FieldType>;
  action: FunctionReturnType<
    typeof api.wayback.get
  >["wayback"][number]["action"];
}) {
  const newAssets = { ...assets };
  const newFields = { ...fields };

  const asset = "assetId" in action ? newAssets[action.assetId] : undefined;
  const field = "fieldId" in action ? newFields[action.fieldId] : undefined;

  switch (action.type) {
    case "create_asset":
      delete newAssets[action.assetId];
      break;
    case "delete_asset":
      if (!asset) {
        console.warn("Asset not found", action.assetId);
        return { assets: newAssets, fields: newFields };
      }
      asset.deleted = false;
      break;
    case "restore_asset":
      if (!asset) {
        console.warn("Asset not found", action.assetId);
        return { assets: newAssets, fields: newFields };
      }
      asset.deleted = true;
      return { assets: newAssets, fields: newFields };
    case "update_asset":
      if (!asset) {
        console.warn("Asset not found", action.assetId);
        return { assets: newAssets, fields: newFields };
      }
      asset.metadata = {
        ...asset.metadata,
        [action.fieldId]: action.oldValue,
      };
      break;
    case "create_field":
      delete newFields[action.fieldId];
      break;
    case "delete_field":
      if (!field) {
        console.warn("Field not found", action.fieldId);
        return { assets: newAssets, fields: newFields };
      }
      field.deleted = false;
      break;
    case "restore_field":
      if (!field) {
        console.warn("Field not found", action.fieldId);
        return { assets: newAssets, fields: newFields };
      }
      field.deleted = true;
      break;
    case "update_field":
      if (!field) {
        console.warn("Field not found", action.fieldId);
        return { assets: newAssets, fields: newFields };
      }
      newFields[action.fieldId] = {
        ...field,
        ...action.oldProps,
      };
      break;
    default:
      break;
  }
  return { assets: newAssets, fields: newFields };
}

function WaybackInner() {
  const users = useStoreWithEqualityFn(
    useHypershelf,
    (state) => state.users,
    isEqual,
  );
  const data = useQuery(api.wayback.get, {
    assetId: undefined,
    fieldId: undefined,
  });
  const assetsData = useQuery(api.assets.get, { includeDeleted: true });
  const fieldsData = useQuery(api.fields.get, { includeDeleted: true });

  const log = useMemo(() => {
    if (!data || !assetsData || !fieldsData) return [];
    let assets = Object.fromEntries(
      assetsData.assets.map((a) => [a.asset._id, a.asset]),
    );
    let fields = Object.fromEntries(
      fieldsData.fields.map((f) => [f.field._id, f.field]),
    );
    const log: ReactNode[] = [];
    for (const entry of data.wayback.toReversed()) {
      const reverted = waybackRevert({ assets, fields, action: entry.action });
      assets = reverted.assets;
      fields = reverted.fields;
      const magicHostnameId = Object.values(fields).find(
        (f) => f.type === "magic__hostname",
      )?._id;
      if (entry.action.type === "create_asset") {
        log.push(
          <div className="text-xs leading-5">
            <div className="gap-1.5 flex items-center">
              <PlusCircle className="size-3 text-muted-foreground" />
              <div>
                Создал хост{" "}
                <Code>
                  {(magicHostnameId &&
                    assets[entry.action.assetId]?.metadata?.[
                      magicHostnameId
                    ]) ??
                    entry.action.assetId}
                </Code>
              </div>
            </div>
          </div>,
        );
      } else if (entry.action.type === "delete_asset") {
        log.push(
          <div className="text-xs leading-5">
            <div className="gap-1.5 flex items-center">
              <Archive className="size-3 text-muted-foreground" />
              <div>
                Удалил хост{" "}
                <Code>
                  {(magicHostnameId &&
                    assets[entry.action.assetId]?.metadata?.[
                      magicHostnameId
                    ]) ??
                    entry.action.assetId}
                </Code>
              </div>
            </div>
          </div>,
        );
      } else if (entry.action.type === "restore_asset") {
        log.push(
          <div className="text-xs leading-5">
            <div className="gap-1.5 flex items-center">
              <ArchiveRestore className="size-3 text-muted-foreground" />
              <div>
                Восстановил хост{" "}
                <Code>
                  {(magicHostnameId &&
                    assets[entry.action.assetId]?.metadata?.[
                      magicHostnameId
                    ]) ??
                    entry.action.assetId}
                </Code>
              </div>
            </div>
          </div>,
        );
      } else if (entry.action.type === "update_asset") {
        log.push(
          <div className="text-xs leading-5">
            <div className="gap-1.5 flex items-center">
              <SquarePen className="size-3 text-muted-foreground" />
              <div>
                Изменил поле{" "}
                <Code>
                  {fields[entry.action.fieldId]?.name ?? entry.action.fieldId}
                </Code>{" "}
                у хоста{" "}
                <Code>
                  {(magicHostnameId &&
                    assets[entry.action.assetId]?.metadata?.[
                      magicHostnameId
                    ]) ??
                    entry.action.assetId}
                </Code>
              </div>
            </div>
            <div className="mt-1 gap-1.5 flex items-center">
              <Code>{entry.action.oldValue ?? "пусто"}</Code>{" "}
              <ArrowRight className="size-3 text-muted-foreground" />{" "}
              <Code>{entry.action.newValue ?? "пусто"}</Code>
            </div>
          </div>,
        );
      } else if (entry.action.type === "create_field") {
        log.push(
          <div className="text-xs leading-5">
            <div className="gap-1.5 flex items-center">
              <PlusCircle className="size-3 text-muted-foreground" />
              <div>
                Создал поле{" "}
                <Code>
                  {fields[entry.action.fieldId]?.name ?? entry.action.fieldId}
                </Code>
              </div>
            </div>
          </div>,
        );
      } else if (entry.action.type === "delete_field") {
        log.push(
          <div className="text-xs leading-5">
            <div className="gap-1.5 flex items-center">
              <Archive className="size-3 text-muted-foreground" />
              <div>
                Удалил поле{" "}
                <Code>
                  {fields[entry.action.fieldId]?.name ?? entry.action.fieldId}
                </Code>
              </div>
            </div>
          </div>,
        );
      } else if (entry.action.type === "restore_field") {
        log.push(
          <div className="text-xs leading-5">
            <div className="gap-1.5 flex items-center">
              <ArchiveRestore className="size-3 text-muted-foreground" />
              <div>
                Восстановил поле{" "}
                <Code>
                  {fields[entry.action.fieldId]?.name ?? entry.action.fieldId}
                </Code>
              </div>
            </div>
          </div>,
        );
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      } else if (entry.action.type === "update_field") {
        log.push(
          <div className="gap-1 text-xs leading-5 flex flex-col">
            <div className="gap-1.5 flex items-center">
              <SquarePen className="size-3 text-muted-foreground" />
              <div>
                Изменил поле{" "}
                <Code>
                  {fields[entry.action.fieldId]?.name ?? entry.action.fieldId}
                </Code>{" "}
              </div>
            </div>
            {!isEqual(
              entry.action.oldProps.name,
              entry.action.newProps.name,
            ) && (
              <div className="gap-1.5 flex items-center">
                Имя: <Code>{entry.action.oldProps.name || "пусто"}</Code>{" "}
                <ArrowRight className="size-3 text-muted-foreground" />{" "}
                <Code>{entry.action.newProps.name || "пусто"}</Code>
              </div>
            )}
            {!isEqual(
              entry.action.oldProps.extra?.description,
              entry.action.newProps.extra?.description,
            ) && (
              <div className="gap-1.5 flex items-center">
                Описание:{" "}
                <Code>
                  {entry.action.oldProps.extra?.description ?? "пусто"}
                </Code>{" "}
                <ArrowRight className="size-3 text-muted-foreground" />{" "}
                <Code>
                  {entry.action.newProps.extra?.description ?? "пусто"}
                </Code>
              </div>
            )}
            {!isEqual(
              entry.action.oldProps.extra?.icon,
              entry.action.newProps.extra?.icon,
            ) && (
              <div className="gap-1.5 flex items-center">
                Иконка:{" "}
                <DynamicIcon
                  name={
                    (entry.action.oldProps.extra?.icon ?? "circle") as IconName
                  }
                  className="size-4"
                />{" "}
                <ArrowRight className="size-3 text-muted-foreground" />{" "}
                <DynamicIcon
                  name={
                    (entry.action.newProps.extra?.icon ?? "circle") as IconName
                  }
                  className="size-4"
                />
              </div>
            )}
            {!isEqual(
              entry.action.oldProps.type,
              entry.action.newProps.type,
            ) && (
              <div className="gap-1.5 flex items-center">
                Тип:{" "}
                <Code>
                  <div className="gap-1.5 flex items-center">
                    <DynamicIcon
                      name={
                        fieldTypesMap[
                          entry.action.oldProps.type as
                            | PlainFieldTypes
                            | MagicFieldTypes
                        ].icon
                      }
                      className="size-3"
                    />
                    {fieldTypesMap[
                      entry.action.oldProps.type as
                        | PlainFieldTypes
                        | MagicFieldTypes
                    ].label || "пусто"}
                  </div>
                </Code>{" "}
                <ArrowRight className="size-3 text-muted-foreground" />{" "}
                <Code>
                  <div className="gap-1.5 flex items-center">
                    <DynamicIcon
                      name={
                        fieldTypesMap[
                          entry.action.newProps.type as
                            | PlainFieldTypes
                            | MagicFieldTypes
                        ].icon
                      }
                      className="size-3"
                    />
                    {
                      fieldTypesMap[
                        entry.action.newProps.type as
                          | PlainFieldTypes
                          | MagicFieldTypes
                      ].label
                    }
                  </div>
                </Code>
              </div>
            )}
            {[
              ...Object.keys(entry.action.oldProps.extra ?? {}),
              ...Object.keys(entry.action.newProps.extra ?? {}),
            ]
              .filter(
                (key) =>
                  key !== "icon" &&
                  key !== "description" &&
                  entry.action.type === "update_field" &&
                  !isEqual(
                    entry.action.oldProps.extra?.[
                      key as keyof typeof entry.action.oldProps.extra
                    ],
                    entry.action.newProps.extra?.[
                      key as keyof typeof entry.action.newProps.extra
                    ],
                  ),
              )
              .map(
                (key) =>
                  entry.action.type === "update_field" && (
                    <div key={key} className="gap-1.5 flex items-center">
                      {fieldProps.find((p) => p.prop === key)?.label ?? key}:{" "}
                      <Code>
                        {JSON.stringify(
                          entry.action.oldProps.extra?.[
                            key as keyof typeof entry.action.oldProps.extra
                          ] ?? "пусто",
                        )}
                      </Code>{" "}
                      <ArrowRight className="size-3 text-muted-foreground" />{" "}
                      <Code>
                        {JSON.stringify(
                          entry.action.newProps.extra?.[
                            key as keyof typeof entry.action.newProps.extra
                          ] ?? "пусто",
                        )}
                      </Code>
                    </div>
                  ),
              )}
          </div>,
        );
      }
    }
    return data.wayback
      .toReversed()
      .map((entry, index) => [entry, log[index]] as [typeof entry, ReactNode]);
  }, [data, assetsData, fieldsData]);

  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: log.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100,
    measureElement: (element) => element.getBoundingClientRect().height,
    overscan: 5,
  });

  if (log.length === 0)
    return <div className="text-sm text-muted-foreground">Летопись пуста</div>;

  return (
    <div
      ref={parentRef}
      className="gap-2 flex max-h-[70vh] flex-col overflow-y-auto"
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        <AnimatePresence>
          {rowVirtualizer.getVirtualItems().map((virtualItem) => {
            const entry = log[virtualItem.index];
            if (!entry) return null;
            const [logEntry, node] = entry;
            return (
              <motion.div
                key={logEntry._id}
                ref={rowVirtualizer.measureElement}
                data-index={virtualItem.index}
                style={{
                  position: "absolute",
                  top: virtualItem.start,
                  left: 0,
                  width: "100%",
                }}
                className="p-2 backdrop-blur-xl bg-background/30"
                initial={{ opacity: 0, y: -5, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -5, scale: 0.95 }}
                transition={{
                  type: "spring",
                  bounce: 0.3,
                  duration: 0.3,
                }}
              >
                <div className="p-2 rounded-md border border-border">
                  <div className="mb-1 text-xs text-muted-foreground">
                    {users[logEntry.actor] ?? "Кто-то"}{" "}
                    {new Date(logEntry.when).toLocaleString()}
                  </div>
                  {node}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

export function Wayback() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button variant="ghost" size="sm">
          <History />
          Открыть летопись
        </Button>
      </Dialog.Trigger>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                className="inset-0 fixed z-[9999]"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: 1,
                  backdropFilter: "blur(4px)",
                  background:
                    "color-mix(in oklab, var(--background) 60%, transparent)",
                }}
                exit={{
                  opacity: 0,
                  backdropFilter: "blur(0px)",
                  background:
                    "color-mix(in oklab, var(--background) 0%, transparent)",
                }}
                transition={{ duration: 0.2 }}
              />
            </Dialog.Overlay>
            <Dialog.Content className="inset-0 p-4 fixed z-[9999] flex items-center justify-center">
              <Dialog.Title>
                <VisuallyHidden>Летопись изменений</VisuallyHidden>
              </Dialog.Title>
              <Dialog.Description>
                <VisuallyHidden>
                  Здесь хранится история всех изменений в системе.
                </VisuallyHidden>
              </Dialog.Description>
              <motion.div
                key="wayback-dialog"
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                transition={{
                  opacity: { duration: 0.1 },
                  scale: { type: "spring", duration: 0.2, bounce: 0.1 },
                }}
                className="w-xl relative"
              >
                <WaybackInner />
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
