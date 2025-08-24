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
import { TableCell, TableRow } from "@/components/ui/table";
import { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { useHypershelf } from "@/stores/assets";
import { memo } from "react";
import { useStoreWithEqualityFn } from "zustand/traditional";
import { FieldRenderer } from "./FieldRenderer";

function DataCell({
  assetId,
  fieldId,
  idx
}: {
  assetId: Id<"assets">;
  fieldId: Id<"fields">;
  idx: number;
}) {
  const isHidden = useHypershelf(state => state.hiddenFields.includes(fieldId));
  return (
    <TableCell
      key={`${assetId}-${fieldId}`}
      className={cn(
        "relative px-2 py-1",
        idx > 0 && "border-border border-l",
        isHidden && "opacity-50"
      )}
    >
      <div className="m-auto flex w-max max-w-sm items-center justify-center break-words break-all hyphens-auto whitespace-normal">
        <FieldRenderer assetId={assetId} fieldId={fieldId} />
      </div>
    </TableCell>
  );
}

function DataRow({ assetId }: { assetId: Id<"assets"> }) {
  const visibleFieldIds = useStoreWithEqualityFn(
    useHypershelf,
    state => {
      const { fieldIds, hiddenFields, hiding } = state;
      if (hiddenFields.length === 0 || !hiding) return fieldIds;
      return fieldIds.filter(f => !hiddenFields.includes(f));
    },
    (a, b) => {
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
      }
      return true;
    }
  );
  const isError = useHypershelf(
    state => !!Object.keys(state.assetErrors[assetId] || {}).length
  );

  return (
    <TableRow
      className={cn("relative", {
        "bg-red-500/10 hover:!bg-red-500/15": isError
      })}
    >
      {visibleFieldIds.map((fieldId, idx) => (
        <DataCell key={fieldId} assetId={assetId} fieldId={fieldId} idx={idx} />
      ))}
    </TableRow>
  );
}

export const DataRowStable = memo(DataRow, (prevProps, nextProps) => {
  return prevProps.assetId === nextProps.assetId;
});
