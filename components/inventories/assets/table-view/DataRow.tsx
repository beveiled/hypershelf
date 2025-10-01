import { TableCell, TableRow } from "@/components/ui/table";
import { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { useHypershelf } from "@/stores";
import { FieldRenderer } from "./FieldRenderer";
import { isEqual } from "lodash";
import { memo } from "react";
import { useStoreWithEqualityFn } from "zustand/traditional";

function DataCell({
  assetId,
  fieldId,
  idx,
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
        isHidden && "opacity-50",
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
      const { fieldIds, hiddenFields, hiding, fields } = state;
      return fieldIds
        .filter(
          f =>
            !fields[f].field.hidden && (!hiding || !hiddenFields.includes(f)),
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
    state => !!Object.keys(state.assetErrors[assetId] || {}).length,
  );

  return (
    <TableRow
      className={cn("relative", {
        "bg-red-500/10 hover:!bg-red-500/15": isError,
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
