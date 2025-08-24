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
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Id } from "@/convex/_generated/dataModel";
import { useHypershelf } from "@/stores/assets";
import { useMemo } from "react";
import { useStoreWithEqualityFn } from "zustand/traditional";
import { DataRowStable } from "./DataRow";
import { HeaderCell } from "./HeaderCell";

export function TableView() {
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
  const hiddenFields = useHypershelf(state => state.hiddenFields);
  const hiding = useHypershelf(state => state.hiding);
  const visibleFieldIds = useMemo(() => {
    if (hiddenFields.length === 0 || !hiding) return fieldIds;
    return fieldIds.filter(f => !hiddenFields.includes(f));
  }, [fieldIds, hiddenFields, hiding]);

  return (
    <>
      <div className="bg-background/70 border-border absolute z-[99] h-8 w-[calc(100vw-1rem)] rounded-tl-md rounded-tr-md border backdrop-blur-lg" />
      <div className="relative h-[calc(100dvh-3.5rem)] overflow-auto overscroll-none rounded-md border">
        <Table className="table-auto">
          <TableHeader className="sticky top-0 z-[100] !border-0">
            <TableRow className="relative h-8 !border-0 hover:bg-transparent">
              {visibleFieldIds.map(fieldId => (
                <HeaderCell key={fieldId} fieldId={fieldId} />
              ))}
            </TableRow>
          </TableHeader>
          <TableBody className="relative">
            {assetIds.length ? (
              assetIds.map(assetId => (
                <DataRowStable key={assetId} assetId={assetId} />
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
