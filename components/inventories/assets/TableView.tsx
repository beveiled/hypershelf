/*
https://github.com/beveiled/hypershelf
Copyright (C) 2025  Daniil Gazizullin

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { useHypershelf } from "@/stores/assets";
import {
  ArrowDown,
  ArrowUpDown,
  Ellipsis,
  Eye,
  GripVertical,
  X
} from "lucide-react";
import { DynamicIcon, IconName } from "lucide-react/dynamic";
import { memo, useMemo, useState } from "react";
import { useStoreWithEqualityFn } from "zustand/traditional";
import { FieldRenderer } from "./FieldRenderer";
import { motion, AnimatePresence } from "framer-motion";

function SortButton({ fieldId }: { fieldId: Id<"fields"> }) {
  const isSorted = useHypershelf(state => state.sorting?.[fieldId]);
  const toggleSorting = useHypershelf(state => state.toggleSorting);

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => toggleSorting(fieldId)}
      className={cn("!size-auto !p-1")}
    >
      {isSorted ? (
        <ArrowDown
          className={cn(
            "size-4 transition-transform duration-200 ease-in-out",
            isSorted === "desc" ? "rotate-180" : ""
          )}
        />
      ) : (
        <ArrowUpDown className="size-4 opacity-50" />
      )}
    </Button>
  );
}

function HeaderCell({ fieldId }: { fieldId: Id<"fields"> }) {
  const field = useHypershelf(state => state.fields?.[fieldId]);
  const canSort = useMemo(() => {
    return (
      field?.type &&
      [
        "string",
        "number",
        "boolean",
        "select",
        "url",
        "ip",
        "user",
        "date",
        "email"
      ].includes(field?.type)
    );
  }, [field?.type]);
  const [actionsExpanded, setActionsExpanded] = useState(false);
  const isSorted = useHypershelf(state => state.sorting?.[fieldId]);

  return (
    field && (
      <div className="flex items-center gap-1 px-2">
        {field.extra?.icon && (
          <DynamicIcon
            name={field.extra.icon as IconName}
            className="mr-1 size-4 opacity-50"
          />
        )}
        {field.name}
        <AnimatePresence mode="popLayout" initial={false}>
          {actionsExpanded ? (
            <motion.div
              key="expanded-actions"
              layoutId={`actions-${fieldId}`}
              layout
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={{
                visible: {
                  scale: 1,
                  transition: {
                    type: "spring",
                    bounce: 0.2,
                    duration: 0.3,
                    staggerChildren: 0.05
                  }
                },
                hidden: {
                  scale: 0.8,
                  transition: {
                    type: "spring",
                    bounce: 0.2,
                    duration: 0.3,
                    staggerChildren: 0.05,
                    staggerDirection: -1
                  }
                }
              }}
              className="flex items-center gap-1"
            >
              {canSort && (
                <motion.div
                  variants={{ visible: { scale: 1 }, hidden: { scale: 0 } }}
                  layoutId={`sort-${fieldId}`}
                >
                  <SortButton fieldId={fieldId} />
                </motion.div>
              )}
              <motion.div
                variants={{ visible: { scale: 1 }, hidden: { scale: 0 } }}
              >
                <Button variant="ghost" size="sm" className="!size-auto !p-1">
                  <Eye className="size-4 opacity-50" />
                </Button>
              </motion.div>
              <motion.div
                variants={{ visible: { scale: 1 }, hidden: { scale: 0 } }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="!size-auto cursor-grab !p-1 active:cursor-grabbing"
                >
                  <GripVertical className="size-4 opacity-50" />
                </Button>
              </motion.div>
              <motion.div
                variants={{ visible: { scale: 1 }, hidden: { scale: 0 } }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="!size-auto !p-1"
                  onClick={() => setActionsExpanded(false)}
                >
                  <X className="size-4 opacity-50" />
                </Button>
              </motion.div>
            </motion.div>
          ) : (
            <div className="flex items-center">
              {isSorted && (
                <motion.div
                  variants={{ visible: { scale: 1 }, hidden: { scale: 0 } }}
                  layoutId={`sort-${fieldId}`}
                  layout
                >
                  <SortButton fieldId={fieldId} />
                </motion.div>
              )}
              <motion.div
                layoutId={`actions-${fieldId}`}
                layout
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.8 }}
                transition={{ type: "spring", bounce: 0.2, duration: 0.3 }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="!size-auto !p-1"
                  onClick={() => setActionsExpanded(true)}
                >
                  <Ellipsis className="size-4 opacity-50" />
                </Button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    )
  );
}

function DataRow({ assetId }: { assetId: Id<"assets"> }) {
  const fieldIds = useHypershelf(state => state.fieldIds);
  const isError = useHypershelf(
    state => !!Object.keys(state.assetErrors[assetId] || {}).length
  );

  return (
    <TableRow
      className={cn("relative", {
        "bg-red-500/10 hover:!bg-red-500/15": isError
      })}
    >
      {fieldIds.map((fieldId, idx) => (
        <TableCell
          key={`${assetId}-${fieldId}`}
          className={cn(
            "relative px-2 py-1",
            idx > 0 && "border-border border-l"
          )}
        >
          <div className="m-auto flex w-max max-w-sm items-center justify-center break-words break-all hyphens-auto whitespace-normal">
            <FieldRenderer assetId={assetId} fieldId={fieldId} />
          </div>
        </TableCell>
      ))}
    </TableRow>
  );
}

const DataRowStable = memo(DataRow, (prevProps, nextProps) => {
  return prevProps.assetId === nextProps.assetId;
});

export function TableView() {
  // TODO: Re-think sorting to make it more efficient and consistent
  const assetIds = useStoreWithEqualityFn(
    useHypershelf,
    state => {
      const { sorting, assets, assetIds } = state;
      const sorted = [...assetIds];

      sorted.sort((a, b) => {
        const assetA = assets[a];
        const assetB = assets[b];

        for (const [fieldId, order] of Object.entries(sorting)) {
          const valueA = assetA.asset.metadata?.[fieldId as Id<"fields">];
          const valueB = assetB.asset.metadata?.[fieldId as Id<"fields">];

          if (valueA === valueB) continue;

          if (valueA == null && valueB == null) continue;
          if (valueA == null) return order === "asc" ? 1 : -1;
          if (valueB == null) return order === "asc" ? -1 : 1;

          if (valueA < valueB) return order === "asc" ? -1 : 1;
          if (valueA > valueB) return order === "asc" ? 1 : -1;
        }

        return 0;
      });

      return sorted;
    },
    (a, b) => {
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
      }
      return true;
    }
  );
  const fieldIds = useHypershelf(state => state.fieldIds);
  // const activeView = useAssetsInventoryStore(state => state.activeViewId && state.views.get(state.activeViewId));
  // const setSorting = useAssetsInventoryStore(state => state.setSorting);
  // const sorting = useAssetsInventoryStore(state => state.sorting);

  // const columnOrder = useMemo(() => {
  //   if (!activeView) return [];
  //   return [
  //     "edit",
  //     ...activeView.fields,
  //     "actions"
  //   ];
  // }, [activeView]);

  // const columnVisibility = useMemo(() => {
  //   if (!activeView || !fieldIds) return {};
  //   return Object.fromEntries([
  //     ...fieldIds.map(f => [
  //       f,
  //       activeView.fields.includes(f)
  //     ]),
  //     ["edit", true],
  //     ["actions", true]
  //   ]);
  // }, [activeView, fieldIds]);

  // const filters = useMemo(() => {
  //   if (!activeView) return undefined;
  //   if (!activeView.enableFiltering) return undefined;
  //   return activeView.filters || undefined;
  // }, [activeView]);

  return (
    <>
      <div className="bg-background/70 border-border absolute z-[99] h-8 w-[calc(100vw-1rem)] rounded-tl-md rounded-tr-md border backdrop-blur-lg" />
      <div className="relative h-[calc(100dvh-3.5rem)] overflow-auto overscroll-none rounded-md border">
        <Table className="table-auto">
          <TableHeader className="sticky top-0 z-[100] !border-0">
            <TableRow className="relative h-8 !border-0 hover:bg-transparent">
              {fieldIds.map(fieldId => (
                <TableHead key={fieldId} className="!h-auto !border-0">
                  <div className="flex items-center justify-center">
                    <HeaderCell fieldId={fieldId} />
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody className="relative">
            {assetIds ? (
              assetIds.map(assetIds => (
                <DataRowStable key={assetIds} assetId={assetIds} />
              ))
            ) : (
              <TableRow>
                <TableCell className="h-24 text-center">
                  Ничего не нашлось. Попробуй изменить фильтры
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
