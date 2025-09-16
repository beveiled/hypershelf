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
}: {
  assetId: Id<"assets">;
  fieldId: Id<"fields">;
}) {
  const value = useHypershelf(
    state => state.assets?.[assetId]?.asset?.metadata?.[fieldId],
  );
  const fieldType = useHypershelf(state => state.fields?.[fieldId]?.type);
  const isRequired = useHypershelf(state => state.fields?.[fieldId]?.required);
  const users = useHypershelf(state => state.users);

  if (!fieldType || !users) return null;

  for (const fieldTypeRenderer of fieldTypes) {
    if (fieldType === fieldTypeRenderer.key) {
      return (
        <fieldTypeRenderer.component assetId={assetId} fieldId={fieldId} />
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
