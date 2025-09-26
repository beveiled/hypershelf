import { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { useHypershelf } from "@/stores";
import { fieldTypes } from "../../fields/fieldTypes";

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
  const value = useHypershelf(
    state => state.assets?.[assetId]?.asset?.metadata?.[fieldId],
  );
  const fieldType = useHypershelf(
    state => state.fields?.[fieldId]?.field?.type,
  );
  const isRequired = useHypershelf(
    state => state.fields?.[fieldId]?.field?.required,
  );
  const users = useHypershelf(state => state.users);

  if (!fieldType || !users) return null;

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
