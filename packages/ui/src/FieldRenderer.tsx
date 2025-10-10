import { isEqual } from "lodash";
import { useStoreWithEqualityFn } from "zustand/traditional";

import type { Id } from "@hypershelf/convex/_generated/dataModel";
import { useHypershelf } from "@hypershelf/lib/stores";
import { cn } from "@hypershelf/lib/utils";

import { fieldTypes } from "./fieldTypes";

function Unset({ required }: { required?: boolean }) {
  return (
    <div
      className={cn(
        "select-none",
        !required && "text-muted-foreground/50 italic",
      )}
    >
      пусто
    </div>
  );
}

export function FieldRenderer({
  assetId,
  fieldId,
  readonly = false,
}: {
  assetId: Id<"assets">;
  fieldId: Id<"fields">;
  readonly?: boolean;
}) {
  const value = useStoreWithEqualityFn(
    useHypershelf,
    (state) => state.assets[assetId]?.asset.metadata?.[fieldId],
    isEqual,
  );
  const fieldType = useHypershelf((state) => state.fields[fieldId]?.field.type);
  const isRequired = useHypershelf(
    (state) => state.fields[fieldId]?.field.required,
  );
  const usersReady = useStoreWithEqualityFn(
    useHypershelf,
    (state) => Object.keys(state.users).length > 0,
    isEqual,
  );

  if (!fieldType || !usersReady) return null;

  for (const fieldTypeRenderer of fieldTypes) {
    if (fieldType === fieldTypeRenderer.key) {
      return (
        <fieldTypeRenderer.component
          assetId={assetId}
          fieldId={fieldId}
          readonly={readonly}
        />
      );
    }
  }

  if (
    value == null ||
    value === "" ||
    (Array.isArray(value) && value.length === 0)
  )
    return <Unset required={isRequired} />;

  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}
