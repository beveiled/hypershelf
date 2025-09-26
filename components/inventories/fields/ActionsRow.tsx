"use client";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ButtonWithKbd } from "@/components/ui/kbd-button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useHypershelf } from "@/stores";
import { useMutation } from "convex/react";
import { Loader2Icon } from "lucide-react";
import { useCallback, useState } from "react";

export function ActionsRow({
  onSave,
  fieldId,
  tooltipContent,
  disabled,
  isSaving,
  onComplete,
}: {
  onSave: (id: Id<"fields"> | null | undefined) => void;
  fieldId?: Id<"fields"> | null;
  tooltipContent: string | null;
  disabled: boolean;
  isSaving: boolean;
  onComplete?: () => void;
}) {
  const [fieldName, setFieldName] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const setExpandedFieldId = useHypershelf(state => state.setExpandedFieldId);

  const deleteField = useMutation(api.fields.remove);

  const onDelete = useCallback(() => {
    if (fieldId) {
      deleteField({ fieldId });
    }
  }, [deleteField, fieldId]);

  const onCancel = useCallback(() => {
    setExpandedFieldId(null);
    onComplete?.();
    const locker = useHypershelf.getState().fieldsLocker;
    if (fieldId) locker.release(fieldId);
  }, [setExpandedFieldId, onComplete, fieldId]);

  return (
    <div className="col-span-full mt-4 flex gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <span>
            <Button
              type="submit"
              variant="default"
              size="sm"
              onClick={() => onSave(fieldId)}
              disabled={disabled}
            >
              {isSaving && <Loader2Icon className="animate-spin" />}
              Сохранить
            </Button>
          </span>
        </TooltipTrigger>
        {!isSaving && tooltipContent && (
          <TooltipContent>
            <p>{tooltipContent}</p>
          </TooltipContent>
        )}
      </Tooltip>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onCancel}
        disabled={isSaving}
      >
        Отмена
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="destructive"
            size="sm"
            disabled={disabled || isSaving}
          >
            Удалить
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="border-red-500">
          <AlertDialogHeader>
            <AlertDialogTitle>Подтверждение удаления</AlertDialogTitle>
            <AlertDialogDescription>
              Нужно ввести название поля, чтобы подтвердить удаление
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="mt-4">
            <Input
              placeholder="Введи название поля"
              value={fieldName}
              onChange={e => setFieldName(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  if (
                    !disabled &&
                    !isSaving &&
                    !isDeleting &&
                    fieldName.trim()
                  ) {
                    setIsDeleting(true);
                    onDelete();
                    setIsDeleting(false);
                  }
                }
              }}
              autoFocus
              disabled={disabled || isSaving || isDeleting}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <ButtonWithKbd variant="outline" keys={["Esc"]}>
                Отмена
              </ButtonWithKbd>
            </AlertDialogCancel>
            <ButtonWithKbd
              variant="destructive"
              onClick={() => {
                setIsDeleting(true);
                onDelete();
                setIsDeleting(false);
              }}
              disabled={disabled || isSaving || isDeleting || !fieldName.trim()}
              keys={["Meta", "Enter"]}
              showKbd={
                !disabled && !isSaving && !isDeleting && !!fieldName.trim()
              }
            >
              {isDeleting && <Loader2Icon className="animate-spin" />}
              Удалить
            </ButtonWithKbd>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
