import { formatQuery } from "@/components/query-builder";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Id } from "@/convex/_generated/dataModel";
import { useHypershelf } from "@/stores";
import { DataRowStable } from "./DataRow";
import { SmartHeader } from "./SmartHeader";
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { apply as jlApply } from "json-logic-js";
import { useCallback } from "react";
import { useStoreWithEqualityFn } from "zustand/traditional";

export function TableView() {
  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor),
  );
  const assetIds = useStoreWithEqualityFn(
    useHypershelf,
    state => {
      const { sorting, assets, assetIds, isFiltering, filters } = state;
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

      if (isFiltering && filters && filters.rules.length > 0) {
        const query = formatQuery(filters);
        return sorted.filter(assetId => {
          return jlApply(query, assets[assetId].asset.metadata || {});
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
  const reorderField = useHypershelf(state => state.reorderField);
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
      <div className="bg-background/70 border-border absolute z-[99] h-8 w-[calc(100vw-1rem)] rounded-tl-md rounded-tr-md border backdrop-blur-lg" />
      <div
        className="relative h-[calc(100dvh-3.5rem)] overflow-auto overscroll-none rounded-md border"
        tabIndex={-1}
      >
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <Table className="table-auto">
            <TableHeader className="sticky top-0 z-[100] !border-0">
              <SmartHeader />
            </TableHeader>
            <TableBody className="relative">
              {assetIds.length ? (
                assetIds.map(assetId => (
                  <DataRowStable key={assetId} assetId={assetId} />
                ))
              ) : (
                <TableRow>
                  <TableCell className="h-24 text-center" colSpan={100}>
                    <div className="w-screen">
                      Ничего не нашлось. Попробуй изменить фильтры
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </DndContext>
      </div>
    </>
  );
}
