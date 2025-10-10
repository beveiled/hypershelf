import { memo } from "react";
import { isEqual } from "lodash";
import { useStoreWithEqualityFn } from "zustand/traditional";

import type { Id } from "@hypershelf/convex/_generated/dataModel";
import { useHypershelf } from "@hypershelf/lib/stores";
import { cn } from "@hypershelf/lib/utils";
import { FieldRenderer } from "@hypershelf/ui";
import { TableCell, TableRow } from "@hypershelf/ui/primitives/table";

import { DeleteAsset } from "./DeleteAsset";

function DataCell({
  assetId,
  fieldId,
}: {
  assetId: Id<"assets">;
  fieldId: Id<"fields">;
}) {
  const isHidden = useHypershelf((state) =>
    state.hiddenFields.includes(fieldId),
  );
  return (
    <TableCell
      key={`${assetId}-${fieldId}`}
      className={cn(
        "px-2 py-1 relative border-l border-border",
        isHidden && "opacity-50",
      )}
    >
      <div className="max-w-sm m-auto flex w-max items-center justify-center break-words break-all hyphens-auto whitespace-normal">
        <FieldRenderer assetId={assetId} fieldId={fieldId} />
      </div>
    </TableCell>
  );
}

function DataRow({ assetId }: { assetId: Id<"assets"> }) {
  const visibleFieldIds = useStoreWithEqualityFn(
    useHypershelf,
    (state) => {
      const { fieldIds, hiddenFields, hiding, fields } = state;
      return fieldIds
        .filter(
          (f) =>
            !fields[f]?.field.hidden && (!hiding || !hiddenFields.includes(f)),
        )
        .sort((a, b) => {
          const posA = state.fieldOrder.indexOf(a);
          const posB = state.fieldOrder.indexOf(b);
          return posA - posB;
        });
    },
    isEqual,
  );
  const isError = useHypershelf(
    (state) => !!Object.keys(state.assetErrors[assetId] ?? {}).length,
  );

  return (
    <TableRow
      className={cn("relative", {
        "bg-red-500/10 hover:!bg-red-500/15": isError,
      })}
      id={`asset-row-${assetId}`}
    >
      <DeleteAsset assetId={assetId} />
      {visibleFieldIds.map((fieldId) => (
        <DataCell key={fieldId} assetId={assetId} fieldId={fieldId} />
      ))}
    </TableRow>
  );
}

export const DataRowStable = memo(DataRow, (prevProps, nextProps) => {
  return prevProps.assetId === nextProps.assetId;
});
