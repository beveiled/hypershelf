import {
  horizontalListSortingStrategy,
  SortableContext,
} from "@dnd-kit/sortable";
import { isEqual } from "lodash";
import { useStoreWithEqualityFn } from "zustand/traditional";

import { useHypershelf } from "@hypershelf/lib/stores";
import { TableHead, TableRow } from "@hypershelf/ui/primitives/table";

import { HeaderCell } from "./HeaderCell";

export function SmartHeader() {
  const visibleFieldIds = useStoreWithEqualityFn(
    useHypershelf,
    (state) =>
      state.fieldIds
        .filter(
          (f) =>
            !state.fields[f]?.field.hidden &&
            (!state.hiding || !state.hiddenFields.includes(f)),
        )
        .sort((a, b) => {
          const posA = state.fieldOrder.indexOf(a);
          const posB = state.fieldOrder.indexOf(b);
          return posA - posB;
        }),
    isEqual,
  );

  return (
    <TableRow className="h-8 relative !border-0 hover:bg-transparent">
      <TableHead className="!h-auto !border-0" />
      <SortableContext
        items={visibleFieldIds}
        strategy={horizontalListSortingStrategy}
      >
        {visibleFieldIds.map((fieldId) => (
          <HeaderCell key={fieldId} fieldId={fieldId} />
        ))}
      </SortableContext>
    </TableRow>
  );
}
