import MarkdownEditor from "@/components/markdown-editor";
import { Label } from "@/components/ui/label";
import { useCallback } from "react";
import { FieldPropArgs, FieldPropConfig } from "./_abstractProp";

function MarkdownPresetProp({
  prop,
  value,
  label,
  lockField,
  isLockedBySomeoneElse,
  change
}: FieldPropArgs) {
  const handleChange = useCallback(
    (content: string) => {
      change(prop, content);
    },
    [change, prop]
  );

  return (
    <div className="flex flex-col gap-1">
      <Label className="block text-xs font-medium">{label}</Label>
      <MarkdownEditor
        value={value?.toString() || ""}
        onChange={handleChange}
        onFocus={lockField}
        disabled={isLockedBySomeoneElse}
      />
    </div>
  );
}

const config: FieldPropConfig = {
  prop: "mdPreset",
  label: "Шаблон Markdown",
  component: MarkdownPresetProp
};
export default config;
