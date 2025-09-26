import MarkdownEditor from "@/components/markdown-editor";
import { Label } from "@/components/ui/label";
import { FieldPropArgs, FieldPropConfig } from "./_abstractProp";
import { useCallback } from "react";

function MarkdownPresetProp({
  value,
  setValue,
  label,
  lockField,
  disabled,
}: FieldPropArgs) {
  const handleChange = useCallback(
    (content: string) => setValue(content),
    [setValue],
  );

  return (
    <div className="flex flex-col gap-1">
      <Label className="block text-xs font-medium">{label}</Label>
      <MarkdownEditor
        value={value?.toString() || ""}
        onChange={handleChange}
        onFocus={lockField}
        disabled={disabled}
      />
    </div>
  );
}

const config: FieldPropConfig = {
  prop: "mdPreset",
  label: "Шаблон Маркдауна",
  component: MarkdownPresetProp,
  full: true,
};
export default config;
