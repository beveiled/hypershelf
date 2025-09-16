import { TableRow } from "@/components/ui/table";
import { shallowPositional } from "@/lib/utils";
import { useHypershelf } from "@/stores";
import { HeaderCell } from "./HeaderCell";
import {
  SortableContext,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useStoreWithEqualityFn } from "zustand/traditional";

export function SmartHeader() {
  const visibleFieldIds = useStoreWithEqualityFn(
    useHypershelf,
    state =>
      state.fieldIds
        .filter(f => !state.hiding || !state.hiddenFields.includes(f))
        .sort((a, b) => {
          const posA = state.fieldOrder.indexOf(a);
          const posB = state.fieldOrder.indexOf(b);
          return posA - posB;
        }),
    shallowPositional,
  );

  return (
    <TableRow className="relative h-8 !border-0 hover:bg-transparent">
      <SortableContext
        items={visibleFieldIds}
        strategy={horizontalListSortingStrategy}
      >
        {visibleFieldIds.map(fieldId => (
          <HeaderCell key={fieldId} fieldId={fieldId} />
        ))}
      </SortableContext>
    </TableRow>
  );
}
