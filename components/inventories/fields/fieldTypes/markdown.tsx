import { MarkdownEditor } from "@/components/markdown-editor";
import { Button } from "@/components/ui/button";
import { ButtonWithKbd } from "@/components/ui/kbd-button";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { useHypershelf } from "@/stores";
import { FieldPropConfig } from "./_abstractType";
import * as Dialog from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useMutation } from "convex/react";
import { AnimatePresence, motion } from "framer-motion";
import { CircleCheck, Download, Eye, Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

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
    state => state.fields?.[fieldId]?.field?.extra?.placeholder || "",
  );
  const mdPreset = useHypershelf(
    state => state.fields?.[fieldId]?.field?.extra?.mdPreset ?? null,
  );
  const value = useHypershelf(
    state => state.assets?.[assetId]?.asset?.metadata?.[fieldId],
  );
  const [val, setVal] = useState(value?.toString() || mdPreset || "");
  const disabled = useHypershelf(
    state => !!state.lockedFields?.[assetId]?.[fieldId],
  );
  const lazyError = useHypershelf(
    state => state.assetErrors?.[assetId]?.[fieldId],
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
          value: newValue,
        }).finally(() => {
          setUpdating(false);
          const locker = useHypershelf.getState().assetsLocker;
          locker.release(assetId, fieldId);
          onClose();
        });
      }, 0);
    },
    [assetId, fieldId, updateAsset, onClose],
  );

  const handleClose = useCallback(() => {
    const locker = useHypershelf.getState().assetsLocker;
    locker.release(assetId, fieldId);
    onClose();
  }, [assetId, fieldId, onClose]);

  const isDirty = useMemo(
    () =>
      val?.toString() !== value?.toString() &&
      val?.toString() !== mdPreset?.toString(),
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
          className="fixed inset-0 z-[9999]"
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
        onEscapeKeyDown={e => {
          e.preventDefault();
          if (e.key === "Escape" && (e.metaKey || e.ctrlKey)) {
            handleClose();
          }
        }}
        onPointerDownOutside={e => e.preventDefault()}
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
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
          className="relative w-full max-w-3xl"
        >
          <MarkdownEditor
            value={val}
            placeholder={placeholder}
            disabled={disabled || updating || readonly}
            onChange={setVal}
            className={cn(
              "bg-background/60 max-h-[90vh] overflow-y-auto backdrop-blur-lg",
              lazyError && "ring-2 ring-red-500",
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
              keys={["Meta", "Esc"]}
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
    state => state.lockedFields?.[assetId]?.[fieldId],
  );
  const isEmpty = useHypershelf(
    state => !state.assets?.[assetId]?.asset?.metadata?.[fieldId],
  );

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      const locker = useHypershelf.getState().assetsLocker;
      locker.release(assetId, fieldId);
    }
    setOpen(isOpen);
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <div className="flex flex-col gap-2">
        {lockedBy && (
          <span className="text-brand absolute -mt-0.5 -translate-y-full text-[10px] whitespace-pre">
            {lockedBy}
          </span>
        )}
        <div
          className={cn(
            "flex",
            lockedBy &&
              "text-foreground/70 ring-brand cursor-not-allowed ring-2",
          )}
        >
          <Dialog.Trigger asChild>
            <Button
              variant="ghost"
              size="sm"
              disabled={!!lockedBy}
              className={cn(
                lockedBy && "!opacity-100 cursor-not-allowed",
                readonly && "h-auto p-0.5",
              )}
            >
              {!isEmpty ? (
                <div className="flex items-center gap-1.5">
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
              className={cn(readonly && "h-auto p-0.5")}
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
