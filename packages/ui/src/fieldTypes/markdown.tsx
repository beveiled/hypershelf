import { useCallback, useEffect, useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useMutation } from "convex/react";
import { AnimatePresence, motion } from "framer-motion";
import { CircleCheck, Download, Eye, Loader2 } from "lucide-react";

import type { Id } from "@hypershelf/convex/_generated/dataModel";
import { api } from "@hypershelf/convex/_generated/api";
import { useHypershelf } from "@hypershelf/lib/stores";
import { cn } from "@hypershelf/lib/utils";

import type { FieldPropConfig } from "./_abstractType";
import { MarkdownEditor } from "../markdownEditor";
import { Button } from "../primitives/button";
import { ButtonWithKbd } from "../primitives/kbd-button";

function MarkdownEditorDialogContent({
  fieldId,
  assetId,
  onClose,
  readonly,
}: {
  fieldId: Id<"fields">;
  assetId: Id<"assets">;
  onClose: () => void;
  readonly: boolean;
}) {
  const placeholder = useHypershelf(
    (state) => state.fields[fieldId]?.field.extra?.placeholder ?? "",
  );
  const mdPreset = useHypershelf(
    (state) => state.fields[fieldId]?.field.extra?.mdPreset ?? null,
  );
  const value = useHypershelf(
    (state) => state.assets[assetId]?.asset.metadata?.[fieldId],
  );
  const [val, setVal] = useState(value?.toString() ?? mdPreset ?? "");
  const disabled = useHypershelf(
    (state) => !!state.lockedFields[assetId]?.[fieldId],
  );
  const lazyError = useHypershelf(
    (state) => state.assetErrors[assetId]?.[fieldId],
  );

  const updateAsset = useMutation(api.assets.update);
  const [updating, setUpdating] = useState(false);

  const onSave = useCallback(
    (newValue: string) => {
      setUpdating(true);
      setTimeout(() => {
        void updateAsset({
          assetId,
          fieldId,
          value: newValue,
        }).finally(() => {
          setUpdating(false);
          const locker = useHypershelf.getState().assetsLocker;
          void locker.release(assetId, fieldId);
          onClose();
        });
      }, 0);
    },
    [assetId, fieldId, updateAsset, onClose],
  );

  const handleClose = useCallback(() => {
    const locker = useHypershelf.getState().assetsLocker;
    void locker.release(assetId, fieldId);
    onClose();
  }, [assetId, fieldId, onClose]);

  const isDirty = useMemo(
    () =>
      val.toString() !== value?.toString() &&
      val.toString() !== mdPreset?.toString(),
    [val, value, mdPreset],
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
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
  }, [isDirty, onSave, val]);

  return (
    <>
      <Dialog.Overlay asChild>
        <motion.div
          className="inset-0 fixed z-[9999]"
          initial={{ opacity: 0 }}
          animate={{
            opacity: 1,
            backdropFilter: "blur(4px)",
            background:
              "color-mix(in oklab, var(--background) 60%, transparent)",
          }}
          exit={{
            opacity: 0,
            backdropFilter: "blur(0px)",
            background:
              "color-mix(in oklab, var(--background) 0%, transparent)",
          }}
          transition={{ duration: 0.2 }}
        />
      </Dialog.Overlay>
      <Dialog.Content
        onEscapeKeyDown={(e) => {
          e.preventDefault();
          if (e.key === "Escape" && (e.metaKey || e.ctrlKey)) {
            handleClose();
          }
        }}
        onPointerDownOutside={(e) => e.preventDefault()}
        className="inset-0 p-4 fixed z-[9999] flex items-center justify-center"
      >
        <Dialog.Title>
          <VisuallyHidden>Редактирование маркдаун-поля</VisuallyHidden>
        </Dialog.Title>
        <Dialog.Description>
          <VisuallyHidden>
            Нажмите Ctrl(Cmd)+Shift+Tab, чтобы редактировать, Ctrl(Cmd)+Esc
            чтобы выйти и Ctrl(Cmd)+S чтобы сохранить.
          </VisuallyHidden>
        </Dialog.Description>
        <motion.div
          key={`markdown-editor-${assetId}-${fieldId}`}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{
            opacity: { duration: 0.1 },
            scale: { type: "spring", duration: 0.2, bounce: 0.1 },
          }}
          className="max-w-3xl relative w-full"
        >
          <MarkdownEditor
            value={val}
            placeholder={placeholder}
            disabled={disabled || updating || readonly}
            onChange={setVal}
            className={cn(
              "backdrop-blur-lg max-h-[90vh] overflow-y-auto bg-background/80",
              lazyError && "ring-red-500 ring-2",
            )}
            defaultExpanded={true}
          />
          {lazyError && isDirty && (
            <div className="mt-1 text-sm text-red-500 text-right">
              {lazyError}
            </div>
          )}
          <div className="mt-2 gap-2 flex justify-end">
            <ButtonWithKbd
              variant="outline"
              onClick={handleClose}
              disabled={updating}
              keys={["Meta", "Esc"]}
            >
              Отмена
            </ButtonWithKbd>
            <ButtonWithKbd
              onClick={() => onSave(val)}
              disabled={disabled || updating || readonly || !isDirty}
              keys={["Meta", "S"]}
              showKbd={isDirty}
            >
              {updating ? (
                <Loader2 className="animate-spin" />
              ) : (
                <CircleCheck />
              )}
              Сохранить
            </ButtonWithKbd>
          </div>
        </motion.div>
      </Dialog.Content>
    </>
  );
}

function InlineMarkdown({
  assetId,
  fieldId,
  readonly = false,
}: {
  assetId: Id<"assets">;
  fieldId: Id<"fields">;
  readonly?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const lockedBy = useHypershelf(
    (state) => state.lockedFields[assetId]?.[fieldId],
  );
  const isEmpty = useHypershelf(
    (state) => !state.assets[assetId]?.asset.metadata?.[fieldId],
  );

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      const locker = useHypershelf.getState().assetsLocker;
      void locker.release(assetId, fieldId);
    }
    setOpen(isOpen);
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <div className="gap-2 flex flex-col">
        {lockedBy && (
          <span className="-mt-0.5 absolute -translate-y-full text-[10px] whitespace-pre text-brand">
            {lockedBy}
          </span>
        )}
        <div
          className={cn(
            "flex",
            lockedBy &&
              "cursor-not-allowed text-foreground/70 ring-2 ring-brand",
          )}
        >
          <Dialog.Trigger asChild>
            <Button
              variant="ghost"
              size="sm"
              disabled={!!lockedBy}
              className={cn(
                lockedBy && "cursor-not-allowed !opacity-100",
                readonly && "p-0.5 h-auto",
              )}
            >
              {!isEmpty ? (
                <div className="gap-1.5 flex items-center">
                  <Eye className={cn(readonly ? "size-3" : "size-4")} />
                  {!readonly && "Открыть"}
                </div>
              ) : (
                <span className="text-muted-foreground/50 italic">пусто</span>
              )}
            </Button>
          </Dialog.Trigger>
          {!isEmpty && (
            <Button
              variant="ghost"
              size="sm"
              disabled={true}
              className={cn(readonly && "p-0.5 h-auto")}
            >
              <Download className={cn(readonly ? "size-3" : "size-4")} />
            </Button>
          )}
          <AnimatePresence>
            {open && (
              <Dialog.Portal forceMount>
                <MarkdownEditorDialogContent
                  fieldId={fieldId}
                  assetId={assetId}
                  readonly={readonly}
                  onClose={() => setOpen(false)}
                />
              </Dialog.Portal>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Dialog.Root>
  );
}

const config = {
  key: "markdown",
  label: "Маркдаун",
  icon: "text-select",
  fieldProps: ["placeholder", "mdPreset"],
  component: InlineMarkdown,
} as const satisfies FieldPropConfig;

export default config;
