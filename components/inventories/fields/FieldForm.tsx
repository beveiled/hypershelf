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
"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { IconName } from "@/components/ui/icon-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { useLog } from "@/components/util/Log";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { FieldType } from "@/convex/fields";
import { ValueType } from "@/convex/schema";
import { useMutation } from "convex/react";
import { WithoutSystemFields } from "convex/server";
import { motion } from "framer-motion";
import { Loader2Icon } from "lucide-react";
import { DynamicIcon } from "lucide-react/dynamic";
import React, {
  memo,
  MemoExoticComponent,
  useCallback,
  useRef,
  useState
} from "react";
import {
  EditableKey,
  ExtraRootKeys,
  FIELD_TYPES,
  getExtrasForType,
  NonSystemKeys
} from "./consts";
import { FieldPropType, getFieldProps } from "./fieldSettings";

type FieldFormProps = {
  fieldId?: Id<"fields"> | null;
  initialValues: WithoutSystemFields<Omit<FieldType, "slug">>;
  lockField?: () => void;
  locked: boolean;
  onCancel: () => void;
  isLockedBySomeoneElse: boolean;
  onDelete?: () => void;
};

type FieldConfig = {
  id: string;
  full?: boolean;
  render: () => React.ReactNode;
};

const ActionsRow = memo(
  function ActionsRow({
    disabled,
    isSaving,
    onSave,
    onCancel,
    fieldId,
    tooltipContent,
    onDelete,
    isLockedBySomeoneElse
  }: {
    disabled: boolean;
    isSaving: boolean;
    onSave: (id: Id<"fields"> | null | undefined) => void;
    onCancel: () => void;
    fieldId?: Id<"fields"> | null;
    tooltipContent: string | null;
    onDelete?: () => void;
    isLockedBySomeoneElse: boolean;
  }) {
    const [fieldName, setFieldName] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
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
        {onDelete && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                disabled={isLockedBySomeoneElse || isSaving}
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
                  onChange={e => setFieldName(e.target.value)}
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel asChild>
                  <Button variant="outline">Отмена</Button>
                </AlertDialogCancel>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (!onDelete) return;
                    setIsDeleting(true);
                    onDelete();
                    setIsDeleting(false);
                  }}
                  disabled={
                    isLockedBySomeoneElse ||
                    isSaving ||
                    isDeleting ||
                    !fieldName.trim()
                  }
                >
                  {isDeleting && <Loader2Icon className="animate-spin" />}
                  Удалить
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    );
  },
  (a, b) =>
    a.disabled === b.disabled &&
    a.isSaving === b.isSaving &&
    a.tooltipContent === b.tooltipContent &&
    a.fieldId === b.fieldId &&
    a.onSave === b.onSave &&
    a.onCancel === b.onCancel &&
    a.onDelete === b.onDelete &&
    a.isLockedBySomeoneElse === b.isLockedBySomeoneElse
);

const TypeField = memo(
  function TypeField({
    value,
    onPending,
    onCommit,
    pendingType,
    lockField,
    isLockedBySomeoneElse
  }: {
    value: string;
    onPending: (next: string | null) => void;
    onCommit: (next: string) => void;
    pendingType: string | null;
    lockField?: () => void;
    isLockedBySomeoneElse: boolean;
  }) {
    return (
      <div className="relative flex flex-col gap-1">
        <Label className="block text-xs font-medium">Тип</Label>
        <Select
          value={value}
          onValueChange={val => onPending(val)}
          disabled={isLockedBySomeoneElse || pendingType !== null}
        >
          <SelectTrigger className="w-full" onClick={lockField}>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            {FIELD_TYPES.map(t => (
              <SelectItem key={t.value} value={t.value}>
                <DynamicIcon name={t.icon as IconName} />
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {pendingType && (
          <Alert className="absolute top-full -mt-2 -ml-3">
            <AlertTitle>Изменить тип поля?</AlertTitle>
            <AlertDescription>
              Изменение типа поля удалит все расширенные настройки.
            </AlertDescription>
            <div className="mt-2 flex space-x-2">
              <Button
                size="sm"
                onClick={() => onCommit(pendingType)}
                variant="destructive"
              >
                Изменить
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPending(null)}
              >
                Отмена
              </Button>
            </div>
          </Alert>
        )}
      </div>
    );
  },
  (a, b) =>
    a.value === b.value &&
    a.pendingType === b.pendingType &&
    a.lockField === b.lockField &&
    a.isLockedBySomeoneElse === b.isLockedBySomeoneElse
);

const ListExtraInput = memo(
  function ListExtraInput({
    label,
    type,
    value,
    onChange,
    onFocus,
    disabled
  }: {
    label: string;
    type: "text" | "number";
    value: ValueType;
    onChange: (v: ValueType) => void;
    onFocus?: () => void;
    disabled: boolean;
  }) {
    return (
      <div className="flex flex-col gap-1">
        <Label className="block text-xs font-medium">{label}</Label>
        <Input
          type={type}
          value={value?.toString() || ""}
          onChange={e =>
            onChange(
              type === "number"
                ? e.target.value === ""
                  ? undefined
                  : Number(e.target.value)
                : e.target.value
            )
          }
          onFocus={onFocus}
          disabled={disabled}
        />
      </div>
    );
  },
  (a, b) =>
    a.type === b.type &&
    a.value === b.value &&
    a.onFocus === b.onFocus &&
    a.disabled === b.disabled &&
    a.label === b.label
);

export function FieldForm({
  fieldId,
  initialValues,
  lockField,
  locked,
  onCancel,
  isLockedBySomeoneElse,
  onDelete
}: FieldFormProps) {
  const updateField = useMutation(api.fields.update);
  const createField = useMutation(api.fields.create);
  const ingestLogs = useLog();

  const [pendingType, setPendingType] = useState<string | null>(null);
  const [values, setValues] =
    useState<WithoutSystemFields<Omit<FieldType, "slug">>>(initialValues);
  const [isSaving, setIsSaving] = useState(false);

  const stableLock = useCallback(() => lockField?.(), [lockField]);

  const onChange = useCallback(
    <K extends EditableKey>(key: K, value: ValueType) => {
      setValues(prev => {
        if (!prev) return prev;
        const [root, child] = key.toString().split(".") as [
          string,
          string | undefined
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
                  [child]: value
                }
              }
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
    []
  );

  const extract = useCallback(
    (
      obj: WithoutSystemFields<Omit<FieldType, "slug">>,
      key: string
    ): ValueType => {
      const isExtra = !["name", "type", "required", "hidden"].includes(key);
      if (isExtra)
        return (
          obj.extra?.[key as Exclude<ExtraRootKeys, "listObjectExtra">] ?? ""
        );
      return obj[key as NonSystemKeys] ?? "";
    },
    []
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
            hidden: values.hidden || false
          });
          ingestLogs(res);
          if (res.success) onCancel();
        } else {
          const res = await createField({
            name: values.name,
            type: values.type,
            required: values.required,
            extra: values.extra || {},
            hidden: values.hidden || false
          });
          ingestLogs(res);
          if (res.success && res.fieldId) onCancel();
        }
      } finally {
        setIsSaving(false);
      }
    },
    [values, ingestLogs, onCancel, updateField, createField]
  );

  const typeExtras = getExtrasForType(values.type);

  const onTypePending = useCallback(
    (next: string | null) => {
      if (next === null) {
        setPendingType(null);
        return;
      }
      const extras = getExtrasForType(values.type);
      const hasExtras = extras.some(k => {
        const v = values.extra?.[k as keyof typeof values.extra];
        return Array.isArray(v) ? v.length > 0 : v != null && v !== "";
      });
      if (hasExtras) setPendingType(next);
      else onChange("type", next);
    },
    [values, onChange]
  );

  const onTypeCommit = useCallback(
    (next: string) => {
      onChange("type", next);
      setPendingType(null);
    },
    [onChange]
  );

  const componentCache = useRef<
    Record<string, MemoExoticComponent<FieldPropType>>
  >({});

  const getWrappedComponent = useCallback((id: string, C: FieldPropType) => {
    if (!componentCache.current[id]) componentCache.current[id] = memo(C);
    return componentCache.current[id];
  }, []);

  const baseFieldProps = getFieldProps(typeExtras);

  const listObjectExtraKeys =
    typeExtras.includes("listObjectExtra") && values.extra?.listObjectType
      ? getExtrasForType(values.extra.listObjectType).filter(
          k => !["icon", "description", "options", "placeholder"].includes(k)
        )
      : [];

  const fields: FieldConfig[] = [];

  fields.push({
    id: "type",
    render: () => (
      <TypeField
        value={values.type}
        onPending={onTypePending}
        onCommit={onTypeCommit}
        pendingType={pendingType}
        lockField={stableLock}
        isLockedBySomeoneElse={isLockedBySomeoneElse}
      />
    )
  });

  baseFieldProps.forEach(f => {
    const Comp = getWrappedComponent(f.key, f.component);
    fields.push({
      id: f.key,
      full: "full" in f ? f.full : false,
      render: () => (
        <Comp
          value={extract(values, f.key)}
          lockField={stableLock}
          isLockedBySomeoneElse={isLockedBySomeoneElse}
          change={onChange}
        />
      )
    });
  });

  listObjectExtraKeys.forEach(rawKey => {
    const labelMap: Record<string, string> = {
      placeholder: "Placeholder",
      regex: "Regex",
      regexError: "Regex Error",
      minLength: "Min Length",
      maxLength: "Max Length",
      minItems: "Min Items",
      maxItems: "Max Items",
      minValue: "Min Value",
      maxValue: "Max Value"
    };
    const label = `List Item ${labelMap[rawKey] || rawKey.replace(/([A-Z])/g, " $1").trim()}`;
    const isNumber = [
      "minValue",
      "maxValue",
      "minLength",
      "maxLength",
      "minItems",
      "maxItems"
    ].includes(rawKey);
    const value =
      values.extra?.listObjectExtra?.[
        rawKey as keyof NonNullable<
          NonNullable<FieldType["extra"]>["listObjectExtra"]
        >
      ] ?? "";
    fields.push({
      id: `listObjectExtra-${rawKey}`,
      render: () => (
        <ListExtraInput
          label={label}
          type={isNumber ? "number" : "text"}
          value={value}
          onChange={v =>
            onChange(`listObjectExtra.${rawKey}` as EditableKey, v)
          }
          onFocus={stableLock}
          disabled={isLockedBySomeoneElse}
        />
      )
    });
  });

  const invalidName = values.name.trim() === "";
  const invalidType = values.type.trim() === "";
  const needsListType =
    values.type === "array" && !values.extra?.listObjectType;
  const disabledSave =
    isLockedBySomeoneElse ||
    !locked ||
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
          needsListType ? "Нужно выбрать тип элементов списка" : null
        ]
          .filter(Boolean)
          .join(" ")
      : null;

  fields.push({
    id: "actions",
    full: true,
    render: () => (
      <ActionsRow
        disabled={disabledSave}
        isSaving={isSaving}
        onSave={onSave}
        onCancel={onCancel}
        fieldId={fieldId}
        tooltipContent={tooltipContent}
        onDelete={onDelete}
        isLockedBySomeoneElse={isLockedBySomeoneElse}
      />
    )
  });

  const total = fields.length;

  return (
    <motion.form
      className="grid max-h-[70vh] grid-cols-1 gap-4 overflow-y-scroll px-2 md:grid-cols-2"
      onClick={e => e.stopPropagation()}
      onSubmit={e => e.preventDefault()}
      initial="collapsed"
      animate="open"
      exit="collapsed"
      variants={{
        open: { opacity: 1, height: "auto", marginTop: 16 },
        collapsed: { opacity: 0, height: 0, marginTop: 0 }
      }}
      transition={{
        opacity: { duration: total * 0.03 + 0.15, type: "spring", bounce: 0.2 },
        height: { duration: 0.1, ease: "easeInOut" },
        marginTop: { duration: total * 0.03, ease: "easeInOut" }
      }}
    >
      <motion.div
        className="contents"
        variants={{
          open: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
          collapsed: {
            transition: { staggerChildren: 0.03, staggerDirection: -1 }
          }
        }}
      >
        {fields.map((f, idx) => (
          <motion.div
            key={f.id}
            className={f.full ? "col-span-full" : ""}
            initial={{ opacity: 0, y: 10 }}
            animate={{
              opacity: 1,
              y: 0,
              transition: { duration: 0.1, delay: idx * 0.03 }
            }}
            exit={{
              opacity: 0,
              y: 10,
              transition: { duration: 0.15, delay: (total - 1 - idx) * 0.03 }
            }}
          >
            {f.render()}
          </motion.div>
        ))}
      </motion.div>
    </motion.form>
  );
}
