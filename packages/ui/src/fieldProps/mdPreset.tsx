import { useCallback } from "react";

import type { FieldPropArgs, FieldPropConfig } from "./_abstractProp";
import MarkdownEditor from "../markdownEditor";
import { Label } from "../primitives/label";

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
    <div className="gap-1 flex flex-col">
      <Label className="text-xs font-medium block">{label}</Label>
      <MarkdownEditor
        value={value?.toString() ?? ""}
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
