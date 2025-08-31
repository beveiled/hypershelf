/*
https://github.com/beveiled/hypershelf
Copyright (C) 2025  Daniil Gazizullin

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/
import { MarkdownEditor } from "@/components/markdown-editor";
import { Button } from "@/components/ui/button";
import { ButtonWithKbd } from "@/components/ui/kbd-button";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { useHypershelf } from "@/stores/assets";
import { useMutation } from "convex/react";
import { CircleCheck, Download, Eye, Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { FieldPropConfig } from "./_abstractType";

function MarkdownEditorPortal({
  fieldId,
  assetId,
  onClose,
  readonly
}: {
  fieldId: Id<"fields">;
  assetId: Id<"assets">;
  onClose: () => void;
  readonly: boolean;
}) {
  const placeholder = useHypershelf(
    state => state.fields?.[fieldId]?.extra?.placeholder || ""
  );
  const mdPreset = useHypershelf(
    state => state.fields?.[fieldId]?.extra?.mdPreset ?? null
  );
  const value = useHypershelf(
    state => state.assets?.[assetId]?.asset?.metadata?.[fieldId]
  );
  const [val, setVal] = useState(value?.toString() || mdPreset || "");
  const disabled = useHypershelf(
    state => !!state.lockedFields?.[assetId]?.[fieldId]
  );
  const lazyError = useHypershelf(
    state => state.assetErrors?.[assetId]?.[fieldId]
  );
  const updateAsset = useMutation(api.assets.update);
  const [updating, setUpdating] = useState(false);
  const onSave = useCallback(
    (newValue: string) => {
      setUpdating(true);
      setTimeout(() => {
        updateAsset({
          assetId,
          fieldId,
          value: newValue
        }).finally(() => {
          setUpdating(false);
          const locker = useHypershelf.getState().locker;
          locker.release(assetId, fieldId);
          onClose();
        });
      }, 0);
    },
    [assetId, fieldId, updateAsset, onClose]
  );
  const handleClose = useCallback(() => {
    const locker = useHypershelf.getState().locker;
    locker.release(assetId, fieldId);
    onClose();
  }, [assetId, fieldId, onClose]);
  const isDirty = useMemo(
    () =>
      val?.toString() !== value?.toString() &&
      val?.toString() !== mdPreset?.toString(),
    [val, value, mdPreset]
  );
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!isDirty && e.key === "Escape") {
        handleClose();
      }
      if (
        isDirty &&
        (e.metaKey || e.ctrlKey) &&
        (e.key === "s" || e.key === "ы")
      ) {
        e.preventDefault();
        onSave(val);
      }
    };
    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("keydown", handler);
    };
  }, [isDirty, handleClose, onSave, val]);

  return (
    <div
      className={cn(
        "bg-background/60 fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-xs"
      )}
    >
      <div className="relative w-full max-w-3xl">
        <MarkdownEditor
          value={val}
          placeholder={placeholder}
          disabled={disabled || updating || readonly}
          onChange={setVal}
          className={cn(
            "bg-background/60 max-h-[90vh] overflow-y-auto backdrop-blur-lg",
            lazyError && "ring-2 ring-red-500"
          )}
          defaultExpanded={true}
        />
        {lazyError && isDirty && (
          <div className="mt-1 text-right text-sm text-red-500">
            {lazyError}
          </div>
        )}
        <div className="mt-2 flex justify-end gap-2">
          <ButtonWithKbd
            variant="outline"
            onClick={handleClose}
            disabled={updating}
            keys={["Esc"]}
            showKbd={!isDirty}
          >
            Отмена
          </ButtonWithKbd>
          <ButtonWithKbd
            onClick={() => onSave(val)}
            disabled={disabled || updating || readonly || !isDirty}
            keys={["Meta", "S"]}
            showKbd={isDirty}
          >
            {updating ? <Loader2 className="animate-spin" /> : <CircleCheck />}
            Сохранить
          </ButtonWithKbd>
        </div>
      </div>
    </div>
  );
}

function InlineMarkdown({
  assetId,
  fieldId,
  readonly = false
}: {
  assetId: Id<"assets">;
  fieldId: Id<"fields">;
  readonly?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const lockedBy = useHypershelf(
    state => state.lockedFields?.[assetId]?.[fieldId]
  );
  const isEmpty = useHypershelf(
    state => !state.assets?.[assetId]?.asset?.metadata?.[fieldId]
  );

  return (
    <div className="flex flex-col gap-2">
      {lockedBy && (
        <span className="text-brand absolute -mt-0.5 -translate-y-full text-[10px] whitespace-pre">
          {lockedBy}
        </span>
      )}
      <div
        className={cn(
          "flex",
          lockedBy && "text-foreground/70 ring-brand cursor-not-allowed ring-2"
        )}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setOpen(true)}
          disabled={!!lockedBy || readonly}
          className={cn(
            lockedBy && "!opacity-100",
            (readonly || lockedBy) && "cursor-not-allowed"
          )}
        >
          {!isEmpty ? (
            <div className="flex items-center gap-1.5">
              <Eye className="size-4" />
              Открыть
            </div>
          ) : (
            <span className="text-muted-foreground/50 italic">пусто</span>
          )}
        </Button>
        {!isEmpty && (
          <Button variant="ghost" size="sm">
            <Download className="size-4" />
          </Button>
        )}
        {open &&
          createPortal(
            <MarkdownEditorPortal
              fieldId={fieldId}
              assetId={assetId}
              readonly={readonly}
              onClose={() => setOpen(false)}
            />,
            document.body
          )}
      </div>
    </div>
  );
}

const config: FieldPropConfig = {
  key: "markdown",
  label: "Маркдаун",
  icon: "text-select",
  fieldProps: ["placeholder", "mdPreset"],
  component: InlineMarkdown
};

export default config;
