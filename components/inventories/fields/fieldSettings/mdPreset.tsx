import { Label } from "@/components/ui/label";
import React from "react";
import { AbstractProp } from "./_abstractProp";
import MarkdownEditor from "@/components/markdown-editor";

const key = "mdPreset";

class MarkdownPresetProp extends AbstractProp {
  handleChange = (content: string) => {
    this.props.change(key, content);
  };

  render() {
    const { value, lockField, isLockedBySomeoneElse } = this.props;
    return (
      <div className="flex flex-col gap-1">
        <Label className="block text-xs font-medium">Шаблон Markdown</Label>
        <MarkdownEditor
          value={value?.toString() || ""}
          onChange={this.handleChange}
          onFocus={lockField}
          disabled={isLockedBySomeoneElse}
        />
      </div>
    );
  }
}

const config = { key, component: MarkdownPresetProp };
export default config;
