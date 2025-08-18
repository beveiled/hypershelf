import { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { fieldTypes } from "../fields/fieldTypes";

import { Button } from "@/components/ui/button";
import { useHypershelf } from "@/stores/assets";
import { Download, Eye } from "lucide-react";

function Unset({ required }: { required?: boolean }) {
  return (
    <div
      className={cn(
        "select-none",
        !required && "text-muted-foreground/50 italic"
      )}
    >
      пусто
    </div>
  );
}

export function FieldRenderer({
  assetId,
  fieldId
}: {
  assetId: Id<"assets">;
  fieldId: Id<"fields">;
}) {
  const value = useHypershelf(
    state => state.assets?.[assetId]?.asset?.metadata?.[fieldId]
  );
  const fieldType = useHypershelf(state => state.fields?.[fieldId]?.type);
  const isRequired = useHypershelf(state => state.fields?.[fieldId]?.required);
  const users = useHypershelf(state => state.users);
  const setMarkdownPreviewContent = useHypershelf(
    state => state.setMarkdownPreviewContent
  );

  if (!fieldType || !users) return null;

  for (const fieldTypeRenderer of fieldTypes) {
    if (fieldType === fieldTypeRenderer.key) {
      return (
        <fieldTypeRenderer.component assetId={assetId} fieldId={fieldId} />
      );
    }
  }

  if (fieldType === "user" && value) {
    const user = users.find(u => u.id === value);
    return user?.email;
  }

  if (fieldType === "markdown" && value) {
    // TODO: Download markdown field contents (.pdf)
    // TODO: Copy pdf link
    return (
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMarkdownPreviewContent(value as string)}
        >
          <Eye className="size-4" />
        </Button>
        <Button variant="ghost" size="sm">
          <Download className="size-4" />
        </Button>
      </div>
    );
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
