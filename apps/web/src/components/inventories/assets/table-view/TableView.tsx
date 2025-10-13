import type { DragEndEvent } from "@dnd-kit/core";
import { useCallback } from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { apply as jlApply } from "json-logic-js";
import { SearchSlash } from "lucide-react";
import { useStoreWithEqualityFn } from "zustand/traditional";

import type { Id } from "@hypershelf/convex/_generated/dataModel";
import type { ValueType } from "@hypershelf/convex/schema";
import { useHypershelf } from "@hypershelf/lib/stores";
import { Table, TableBody, TableHeader } from "@hypershelf/ui/primitives/table";

import { formatQuery } from "~/components/query-builder";
import { DataRowStable } from "./DataRow";
import { SmartHeader } from "./SmartHeader";

export function TableView() {
  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor),
  );
  const assetIds = useStoreWithEqualityFn(
    useHypershelf,
    (state) => {
      const { sorting, assets, assetIds, isFiltering, filters, createdAssets } =
        state;
      const sorted = [...assetIds];

      sorted.sort((a, b) => {
        const assetA = assets[a];
        const assetB = assets[b];

        for (const [fieldId, order] of Object.entries(sorting)) {
          const valueA = assetA?.asset.metadata?.[
            fieldId as Id<"fields">
          ] as ValueType;
          const valueB = assetB?.asset.metadata?.[
            fieldId as Id<"fields">
          ] as ValueType;

          if (valueA === valueB) continue;

          if (valueA == null && valueB == null) continue;
          if (valueA == null) return order === "asc" ? 1 : -1;
          if (valueB == null) return order === "asc" ? -1 : 1;

          if (valueA < valueB) return order === "asc" ? -1 : 1;
          if (valueA > valueB) return order === "asc" ? 1 : -1;
        }

        return 0;
      });

      if (isFiltering && filters && filters.rules.length > 0) {
        const query = formatQuery(filters);
        return sorted.filter((assetId) => {
          return (
            createdAssets.includes(assetId) ||
            jlApply(query, assets[assetId]?.asset.metadata ?? {})
          );
        });
      }

      return sorted;
    },
    (a, b) => {
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
      }
      return true;
    },
  );
  const reorderField = useHypershelf((state) => state.reorderField);
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (active.id !== over?.id) {
        reorderField(active.id as Id<"fields">, over?.id as Id<"fields">);
      }
    },
    [reorderField],
  );

  return (
    <>
      {assetIds.length ? (
        <div className="h-8 backdrop-blur-lg absolute z-[99] w-[calc(100vw-1rem)] rounded-tl-md rounded-tr-md border border-border bg-background/70" />
      ) : null}
      <div
        className="relative h-[calc(100dvh-3.5rem)] overflow-auto overscroll-none rounded-md border"
        tabIndex={-1}
      >
        {assetIds.length ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <Table className="table-auto">
              <TableHeader className="top-0 sticky z-[100] !border-0">
                <SmartHeader />
              </TableHeader>
              <TableBody className="relative">
                {assetIds.map((assetId) => (
                  <DataRowStable key={assetId} assetId={assetId} />
                ))}
              </TableBody>
            </Table>
          </DndContext>
        ) : (
          <div className="p-12 gap-2 mt-4 max-w-lg mx-auto flex flex-col items-center rounded-xl border border-border text-center">
            <div className="size-10 mb-2 flex items-center justify-center rounded-md bg-muted">
              <SearchSlash className="size-6" />
            </div>
            <div className="text-lg font-medium">Нет результатов</div>
            <div className="text-sm/relaxed text-muted-foreground">
              Попробуй изменить фильтры или поменять вид, чтобы увидеть больше
              результатов.
            </div>
          </div>
        )}
      </div>
    </>
  );
}
