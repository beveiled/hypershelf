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
import { TableRow } from "@/components/ui/table";
import { useHypershelf } from "@/stores/assets";
import { HeaderCell } from "./HeaderCell";

import {
  horizontalListSortingStrategy,
  SortableContext
} from "@dnd-kit/sortable";
import { useStoreWithEqualityFn } from "zustand/traditional";
import { shallowPositional } from "@/lib/utils";

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
    shallowPositional
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
