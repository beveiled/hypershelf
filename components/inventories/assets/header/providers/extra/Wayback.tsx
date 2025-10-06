import { fieldProps } from "@/components/inventories/fields/fieldProps";
import {
  MagicFieldTypes,
  PlainFieldTypes,
  fieldTypesMap,
} from "@/components/inventories/fields/fieldTypes";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { AssetType, FieldType } from "@/convex/schema";
import { useHypershelf } from "@/stores";
import * as Dialog from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useQuery } from "convex/react";
import { FunctionReturnType } from "convex/server";
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
import { DynamicIcon, IconName } from "lucide-react/dynamic";
import { ReactNode, useMemo, useRef, useState } from "react";
import { useStoreWithEqualityFn } from "zustand/traditional";

function Code({ children }: { children: React.ReactNode }) {
  return <span className="font-mono bg-muted px-1 rounded">{children}</span>;
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

  switch (action.type) {
    case "create_asset":
      delete newAssets[action.assetId];
      break;
    case "delete_asset":
      newAssets[action.assetId].deleted = false;
      break;
    case "restore_asset":
      newAssets[action.assetId].deleted = true;
      return { assets: newAssets, fields: newFields };
    case "update_asset":
      if (!newAssets[action.assetId]) {
        console.warn("Asset not found", action.assetId);
        return { assets: newAssets, fields: newFields };
      }
      newAssets[action.assetId].metadata = {
        ...newAssets[action.assetId].metadata,
        [action.fieldId]: action.oldValue,
      };
      break;
    case "create_field":
      delete newFields[action.fieldId];
      break;
    case "delete_field":
      newFields[action.fieldId].deleted = false;
      break;
    case "restore_field":
      newFields[action.fieldId].deleted = true;
      break;
    case "update_field":
      if (!newFields[action.fieldId]) {
        console.warn("Field not found", action.fieldId);
        return { assets: newAssets, fields: newFields };
      }
      newFields[action.fieldId] = {
        ...newFields[action.fieldId],
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
    state => state.users,
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
      assetsData.assets.map(a => [a.asset._id, a.asset]),
    );
    let fields = Object.fromEntries(
      fieldsData.fields.map(f => [f.field._id, f.field]),
    );
    const log: ReactNode[] = [];
    for (const entry of data.wayback.toReversed()) {
      const reverted = waybackRevert({ assets, fields, action: entry.action });
      assets = reverted.assets;
      fields = reverted.fields;
      const magicHostnameId = Object.values(fields).find(
        f => f.type === "magic__hostname",
      )?._id;
      if (entry.action.type === "create_asset") {
        log.push(
          <div className="text-xs leading-5">
            <div className="flex items-center gap-1.5">
              <PlusCircle className="size-3 text-muted-foreground" />
              <div>
                Создал хост{" "}
                <Code>
                  {(magicHostnameId &&
                    assets[entry.action.assetId]?.metadata?.[
                      magicHostnameId
                    ]) ||
                    entry.action.assetId}
                </Code>
              </div>
            </div>
          </div>,
        );
      } else if (entry.action.type === "delete_asset") {
        log.push(
          <div className="text-xs leading-5">
            <div className="flex items-center gap-1.5">
              <Archive className="size-3 text-muted-foreground" />
              <div>
                Удалил хост{" "}
                <Code>
                  {(magicHostnameId &&
                    assets[entry.action.assetId]?.metadata?.[
                      magicHostnameId
                    ]) ||
                    entry.action.assetId}
                </Code>
              </div>
            </div>
          </div>,
        );
      } else if (entry.action.type === "restore_asset") {
        log.push(
          <div className="text-xs leading-5">
            <div className="flex items-center gap-1.5">
              <ArchiveRestore className="size-3 text-muted-foreground" />
              <div>
                Восстановил хост{" "}
                <Code>
                  {(magicHostnameId &&
                    assets[entry.action.assetId]?.metadata?.[
                      magicHostnameId
                    ]) ||
                    entry.action.assetId}
                </Code>
              </div>
            </div>
          </div>,
        );
      } else if (entry.action.type === "update_asset") {
        log.push(
          <div className="text-xs leading-5">
            <div className="flex items-center gap-1.5">
              <SquarePen className="size-3 text-muted-foreground" />
              <div>
                Изменил поле{" "}
                <Code>
                  {fields[entry.action.fieldId]?.name || entry.action.fieldId}
                </Code>{" "}
                у хоста{" "}
                <Code>
                  {(magicHostnameId &&
                    assets[entry.action.assetId]?.metadata?.[
                      magicHostnameId
                    ]) ||
                    entry.action.assetId}
                </Code>
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <Code>{entry.action.oldValue ?? "пусто"}</Code>{" "}
              <ArrowRight className="size-3 text-muted-foreground" />{" "}
              <Code>{entry.action.newValue ?? "пусто"}</Code>
            </div>
          </div>,
        );
      } else if (entry.action.type === "create_field") {
        log.push(
          <div className="text-xs leading-5">
            <div className="flex items-center gap-1.5">
              <PlusCircle className="size-3 text-muted-foreground" />
              <div>
                Создал поле{" "}
                <Code>
                  {fields[entry.action.fieldId]?.name || entry.action.fieldId}
                </Code>
              </div>
            </div>
          </div>,
        );
      } else if (entry.action.type === "delete_field") {
        log.push(
          <div className="text-xs leading-5">
            <div className="flex items-center gap-1.5">
              <Archive className="size-3 text-muted-foreground" />
              <div>
                Удалил поле{" "}
                <Code>
                  {fields[entry.action.fieldId]?.name || entry.action.fieldId}
                </Code>
              </div>
            </div>
          </div>,
        );
      } else if (entry.action.type === "restore_field") {
        log.push(
          <div className="text-xs leading-5">
            <div className="flex items-center gap-1.5">
              <ArchiveRestore className="size-3 text-muted-foreground" />
              <div>
                Восстановил поле{" "}
                <Code>
                  {fields[entry.action.fieldId]?.name || entry.action.fieldId}
                </Code>
              </div>
            </div>
          </div>,
        );
      } else if (entry.action.type === "update_field") {
        log.push(
          <div className="text-xs leading-5 flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <SquarePen className="size-3 text-muted-foreground" />
              <div>
                Изменил поле{" "}
                <Code>
                  {fields[entry.action.fieldId]?.name || entry.action.fieldId}
                </Code>{" "}
              </div>
            </div>
            {!isEqual(
              entry.action.oldProps.name,
              entry.action.newProps.name,
            ) && (
              <div className="flex items-center gap-1.5">
                Имя: <Code>{entry.action.oldProps.name || "пусто"}</Code>{" "}
                <ArrowRight className="size-3 text-muted-foreground" />{" "}
                <Code>{entry.action.newProps.name || "пусто"}</Code>
              </div>
            )}
            {!isEqual(
              entry.action.oldProps.extra?.description,
              entry.action.newProps.extra?.description,
            ) && (
              <div className="flex items-center gap-1.5">
                Описание:{" "}
                <Code>
                  {entry.action.oldProps.extra?.description || "пусто"}
                </Code>{" "}
                <ArrowRight className="size-3 text-muted-foreground" />{" "}
                <Code>
                  {entry.action.newProps.extra?.description || "пусто"}
                </Code>
              </div>
            )}
            {!isEqual(
              entry.action.oldProps.extra?.icon,
              entry.action.newProps.extra?.icon,
            ) && (
              <div className="flex items-center gap-1.5">
                Иконка:{" "}
                <DynamicIcon
                  name={
                    (entry.action.oldProps.extra?.icon || "circle") as IconName
                  }
                  className="size-4"
                />{" "}
                <ArrowRight className="size-3 text-muted-foreground" />{" "}
                <DynamicIcon
                  name={
                    (entry.action.newProps.extra?.icon || "circle") as IconName
                  }
                  className="size-4"
                />
              </div>
            )}
            {!isEqual(
              entry.action.oldProps.type,
              entry.action.newProps.type,
            ) && (
              <div className="flex items-center gap-1.5">
                Тип:{" "}
                <Code>
                  <div className="flex items-center gap-1.5">
                    <DynamicIcon
                      name={
                        (fieldTypesMap[
                          entry.action.oldProps.type as
                            | PlainFieldTypes
                            | MagicFieldTypes
                        ]?.icon as IconName) || "circle"
                      }
                      className="size-3"
                    />
                    {fieldTypesMap[
                      entry.action.oldProps.type as
                        | PlainFieldTypes
                        | MagicFieldTypes
                    ]?.label || "пусто"}
                  </div>
                </Code>{" "}
                <ArrowRight className="size-3 text-muted-foreground" />{" "}
                <Code>
                  <div className="flex items-center gap-1.5">
                    <DynamicIcon
                      name={
                        (fieldTypesMap[
                          entry.action.newProps.type as
                            | PlainFieldTypes
                            | MagicFieldTypes
                        ]?.icon as IconName) || "circle"
                      }
                      className="size-3"
                    />
                    {fieldTypesMap[
                      entry.action.newProps.type as
                        | PlainFieldTypes
                        | MagicFieldTypes
                    ]?.label || "пусто"}
                  </div>
                </Code>
              </div>
            )}
            {[
              ...Object.keys(entry.action.oldProps.extra ?? {}),
              ...Object.keys(entry.action.newProps.extra ?? {}),
            ]
              .filter(
                key =>
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
                key =>
                  entry.action.type === "update_field" && (
                    <div key={key} className="flex items-center gap-1.5">
                      {fieldProps.find(p => p.prop === key)?.label || key}:{" "}
                      <Code>
                        {entry.action.oldProps.extra?.[
                          key as keyof typeof entry.action.oldProps.extra
                        ]?.toString() || "пусто"}
                      </Code>{" "}
                      <ArrowRight className="size-3 text-muted-foreground" />{" "}
                      <Code>
                        {entry.action.newProps.extra?.[
                          key as keyof typeof entry.action.newProps.extra
                        ]?.toString() || "пусто"}
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
    measureElement: element => element.getBoundingClientRect().height,
    overscan: 5,
  });

  if (log.length === 0)
    return <div className="text-sm text-muted-foreground">Летопись пуста</div>;

  return (
    <div
      ref={parentRef}
      className="flex flex-col gap-2 max-h-[70vh] overflow-y-auto"
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        <AnimatePresence>
          {rowVirtualizer.getVirtualItems().map(virtualItem => {
            const [entry, node] = log[virtualItem.index];
            return (
              <motion.div
                key={entry._id}
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
                <div className="border border-border rounded-md p-2">
                  <div className="text-xs text-muted-foreground mb-1">
                    {users[entry.actor] ?? "Кто-то"}{" "}
                    {new Date(entry.when).toLocaleString()}
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
                className="fixed inset-0 z-[9999]"
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
            <Dialog.Content className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
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
                className="relative w-xl"
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
