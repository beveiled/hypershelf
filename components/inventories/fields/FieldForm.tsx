"use client";

import {
  EditableKey,
  ExtraRootKeys,
  NonSystemKeys,
  getPropsForType,
} from "@/components/inventories/fields/fieldTypes";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { FieldType, ValueType } from "@/convex/schema";
import { cn } from "@/lib/utils";
import { useHypershelf } from "@/stores";
import { ActionsRow } from "./ActionsRow";
import { FieldTypeProp } from "./FieldTypeProp";
import { fieldProps, getFieldProps } from "./fieldProps";
import { useMutation } from "convex/react";
import { WithoutSystemFields } from "convex/server";
import { HTMLMotionProps, motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useCallback, useState } from "react";

const defaultNewField: WithoutSystemFields<Omit<FieldType, "slug">> = {
  name: "",
  type: "string",
  required: false,
  extra: {},
};

export function FieldForm({
  fieldId,
  onComplete,
  className,
  ...props
}: HTMLMotionProps<"form"> & {
  fieldId?: Id<"fields">;
  onComplete?: () => void;
}) {
  const updateField = useMutation(api.fields.update);
  const createField = useMutation(api.fields.create);

  const stableLock = useCallback(() => {
    if (!fieldId) return;
    const locker = useHypershelf.getState().fieldsLocker;
    locker.acquire(fieldId);
  }, [fieldId]);
  const disabled = useHypershelf(
    state =>
      !!(
        fieldId &&
        state.fields[fieldId]?.editingBy &&
        state.fields[fieldId]?.editingBy?.id !== state.viewer
      ),
  );
  const setExpandedFieldId = useHypershelf(state => state.setExpandedFieldId);

  const [pendingType, setPendingType] = useState<string | null>(null);
  const [values, setValues] = useState<
    WithoutSystemFields<Omit<FieldType, "slug">>
  >(
    (fieldId ? useHypershelf.getState().fields?.[fieldId]?.field : null) ||
      defaultNewField,
  );
  const [isSaving, setIsSaving] = useState(false);

  const onChange = useCallback(
    <K extends EditableKey>(key: K, value: ValueType) => {
      setValues(prev => {
        if (!prev) return prev;
        const [root, child] = key.toString().split(".") as [
          string,
          string | undefined,
        ];
        const isExtra = !["name", "type", "required", "hidden"].includes(root);
        if (isExtra) {
          const parent = root as ExtraRootKeys;
          if (child) {
            const current = (
              prev.extra?.[parent] as Record<string, ValueType>
            )?.[child];
            if (current === value) return prev;
            return {
              ...prev,
              extra: {
                ...prev.extra,
                [parent]: {
                  ...((prev.extra?.[parent] as Record<string, ValueType>) ??
                    {}),
                  [child]: value,
                },
              },
            };
          }
          if (prev.extra?.[parent] === value) return prev;
          return { ...prev, extra: { ...prev.extra, [parent]: value } };
        }
        const field = root as NonSystemKeys;
        if (prev[field] === value) return prev;
        return { ...prev, [field]: value } as typeof prev;
      });
    },
    [],
  );

  const extract = useCallback(
    (
      obj: WithoutSystemFields<Omit<FieldType, "slug">>,
      key: string,
    ): ValueType => {
      const isExtra = !["name", "type", "required", "hidden"].includes(key);
      if (isExtra)
        return (
          obj.extra?.[key as Exclude<ExtraRootKeys, "listObjectExtra">] ?? ""
        );
      return obj[key as NonSystemKeys] ?? "";
    },
    [],
  );

  const onSave = useCallback(
    async (id: Id<"fields"> | null | undefined) => {
      if (!values) return;
      setIsSaving(true);
      try {
        if (id) {
          const res = await updateField({
            fieldId: id,
            name: values.name,
            type: values.type,
            required: values.required,
            extra: values.extra || {},
            hidden: values.hidden || false,
          });
          if (res.success) {
            setExpandedFieldId(null);
            onComplete?.();
            const locker = useHypershelf.getState().fieldsLocker;
            locker.release(id);
          }
        } else {
          const res = await createField({
            name: values.name,
            type: values.type,
            required: values.required,
            extra: values.extra || {},
            hidden: values.hidden || false,
          });
          if (res.success && res.fieldId) {
            setExpandedFieldId(null);
            onComplete?.();
          }
        }
      } finally {
        setIsSaving(false);
      }
    },
    [values, setExpandedFieldId, updateField, createField, onComplete],
  );

  const typeExtras = getPropsForType(values.type);

  const onTypeCommit = useCallback(
    (next: string) => {
      onChange("type", next);
      setPendingType(null);
    },
    [onChange],
  );

  const baseFieldProps = getFieldProps(typeExtras);

  const listObjectExtraKeys =
    typeExtras.includes("listObjectExtra") && values.extra?.listObjectType
      ? getPropsForType(values.extra.listObjectType).filter(
          k => !["icon", "description", "options", "placeholder"].includes(k),
        )
      : [];

  const invalidName = values.name.trim() === "";
  const invalidType = values.type.trim() === "";
  const needsListType =
    values.type === "array" && !values.extra?.listObjectType;

  const disabledSave =
    disabled ||
    isSaving ||
    invalidName ||
    invalidType ||
    pendingType !== null ||
    needsListType;

  const tooltipContent =
    !isSaving &&
    (invalidName || invalidType || pendingType !== null || needsListType)
      ? [
          invalidName ? "Имя обязательное" : null,
          invalidType ? "Тип обязательные" : null,
          pendingType !== null
            ? "Измени тип поля или отмени, прежде чем сохранять"
            : null,
          needsListType ? "Нужно выбрать тип элементов списка" : null,
        ]
          .filter(Boolean)
          .join(" ")
      : null;

  return (
    <motion.form
      className={cn("grid grid-cols-1 gap-4 px-2 md:grid-cols-2", className)}
      onClick={e => e.stopPropagation()}
      onSubmit={e => e.preventDefault()}
      initial="collapsed"
      animate="open"
      exit="collapsed"
      variants={{
        open: { opacity: 1, height: "auto", marginTop: 16 },
        collapsed: { opacity: 0, height: 0, marginTop: 0 },
      }}
      transition={{
        opacity: { duration: 0.45, type: "spring", bounce: 0.5 },
        height: { duration: 0.3, ease: "easeInOut" },
        marginTop: { duration: 0.3, ease: "easeInOut" },
      }}
      {...props}
    >
      <motion.div
        className="contents"
        variants={{
          open: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
          collapsed: {
            transition: { staggerChildren: 0.03, staggerDirection: -1 },
          },
        }}
      >
        <FieldTypeProp
          value={values.type}
          onCommit={onTypeCommit}
          lockField={stableLock}
          disabled={disabled}
          extra={values.extra}
        />
        {baseFieldProps.map(f => (
          <div key={f.prop} className={cn(f.full && "col-span-full")}>
            <f.component
              value={extract(values, f.prop)}
              label={f.label}
              lockField={stableLock}
              disabled={disabled}
              setValue={(value: ValueType) => onChange(f.prop, value)}
            />
          </div>
        ))}
        {listObjectExtraKeys.map(rawKey => {
          const prop = fieldProps.find(p => p.prop === rawKey);
          if (!prop) return null;
          const label = `Элементы: ${prop.label}`;
          const value =
            values.extra?.listObjectExtra?.[
              rawKey as keyof NonNullable<
                NonNullable<FieldType["extra"]>["listObjectExtra"]
              >
            ] ?? "";
          const editableProp = `listObjectExtra-${rawKey}` as EditableKey;
          return (
            <prop.component
              key={editableProp}
              label={label}
              value={value}
              setValue={(v: ValueType) => onChange(editableProp, v)}
              lockField={stableLock}
              disabled={disabled}
            />
          );
        })}
        <ActionsRow
          onSave={() => onSave(fieldId)}
          fieldId={fieldId}
          tooltipContent={tooltipContent}
          disabled={disabledSave}
          isSaving={isSaving}
          onComplete={onComplete}
        />
      </motion.div>
    </motion.form>
  );
}

export function NewFieldForm() {
  const [open, setOpen] = useState(false);
  const onComplete = useCallback(() => setOpen(false), []);

  return (
    <>
      <Button
        variant="outline"
        className="mx-auto w-lg sm:w-full"
        onClick={() => setOpen(true)}
      >
        <Plus />
        Создать новое поле
      </Button>
      <AlertDialog open={open} onOpenChange={() => {}}>
        <AlertDialogContent className="max-w-[calc(100vw-1rem)] sm:!max-w-2xl max-h-[calc(100vh-6rem)] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-title relative text-left text-2xl font-extrabold">
              New Field
              <div className="bg-brand absolute bottom-0 left-0 h-1 w-8"></div>
            </AlertDialogTitle>
          </AlertDialogHeader>
          <FieldForm onComplete={onComplete} initial="open" exit="open" />
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
