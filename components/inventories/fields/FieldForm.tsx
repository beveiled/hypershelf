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

import {
  EditableKey,
  ExtraRootKeys,
  fieldTypes,
  getPropsForType,
  NonSystemKeys
} from "@/components/inventories/fields/fieldTypes";
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import { IconName } from "@/components/ui/icon-picker";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { FieldType } from "@/convex/fields";
import { ValueType } from "@/convex/schema";
import { cn } from "@/lib/utils";
import { useMutation } from "convex/react";
import { WithoutSystemFields } from "convex/server";
import { motion } from "framer-motion";
import { Check, ChevronDown, Loader2Icon } from "lucide-react";
import { DynamicIcon } from "lucide-react/dynamic";
import React, {
  memo,
  MemoExoticComponent,
  useCallback,
  useMemo,
  useRef,
  useState
} from "react";
import { fieldProps, FieldPropType, getFieldProps } from "./fieldProps";
import { AnimateTransition } from "./fieldTypes/string";

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
                  value={fieldName}
                  onChange={e => setFieldName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      if (
                        !isLockedBySomeoneElse &&
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
                  disabled={isLockedBySomeoneElse || isSaving || isDeleting}
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel asChild>
                  <Button variant="outline">
                    Отмена
                    <Kbd keys={["Esc"]} />
                  </Button>
                </AlertDialogCancel>
                <Button
                  variant="destructive"
                  onClick={() => {
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
                  {!isLockedBySomeoneElse &&
                    !isSaving &&
                    !isDeleting &&
                    fieldName.trim() && (
                      <Kbd keys={["Meta", "Enter"]} variant="white" />
                    )}
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
    const selectedType = useMemo(
      () => fieldTypes.find(t => t.key === value),
      [value]
    );

    return (
      <div className="relative flex flex-col gap-1">
        <Label className="block text-xs font-medium">Тип</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              disabled={isLockedBySomeoneElse || pendingType !== null}
              onClick={lockField}
            >
              <AnimateTransition postfix="field-type-changer">
                {selectedType ? (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <DynamicIcon name={selectedType.icon as IconName} />
                      {selectedType.label}
                    </div>
                    <ChevronDown className="opacity-50" />
                  </div>
                ) : (
                  <span className="text-muted-foreground/50 italic">пусто</span>
                )}
              </AnimateTransition>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-fit p-0">
            <Command
              className="!bg-transparent !backdrop-blur-none"
              value={value}
            >
              <CommandInput
                placeholder="Поиск..."
                className="h-9"
                disabled={isLockedBySomeoneElse || pendingType !== null}
              />
              <CommandList>
                <CommandEmpty>Не нашли ничего</CommandEmpty>
                <CommandGroup>
                  {fieldTypes.map(fieldType => (
                    <CommandItem
                      key={fieldType.key}
                      value={fieldType.key}
                      disabled={isLockedBySomeoneElse || pendingType !== null}
                      onSelect={val => onPending(val)}
                    >
                      <div className="flex items-center gap-1.5">
                        <DynamicIcon name={fieldType.icon as IconName} />
                        {fieldType.label}
                      </div>
                      <Check
                        className={cn(
                          "ml-auto",
                          value === fieldType.key ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {pendingType && (
          <Alert className="absolute top-full z-50 m-4 flex size-fit flex-col">
            <AlertTitle>Изменить тип поля?</AlertTitle>
            <AlertDescription>
              Изменение типа поля удалит все расширенные настройки.
            </AlertDescription>
            <div className="mt-2 flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => onCommit(pendingType)}
                variant="destructive"
              >
                Изменить
                <Kbd keys={["Meta", "Enter"]} />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPending(null)}
              >
                Отмена
                <Kbd keys={["Esc"]} />
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
          if (res.success) onCancel();
        } else {
          const res = await createField({
            name: values.name,
            type: values.type,
            required: values.required,
            extra: values.extra || {},
            hidden: values.hidden || false
          });
          if (res.success && res.fieldId) onCancel();
        }
      } finally {
        setIsSaving(false);
      }
    },
    [values, onCancel, updateField, createField]
  );

  const typeExtras = getPropsForType(values.type);

  const onTypePending = useCallback(
    (next: string | null) => {
      if (next === null) {
        setPendingType(null);
        return;
      }
      const extras = getPropsForType(values.type);
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
      ? getPropsForType(values.extra.listObjectType).filter(
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
    const Comp = getWrappedComponent(f.prop, f.component);
    fields.push({
      id: f.prop,
      full: "full" in f ? f.full : false,
      render: () => (
        <Comp
          value={extract(values, f.prop)}
          prop={f.prop}
          label={f.label}
          lockField={stableLock}
          isLockedBySomeoneElse={isLockedBySomeoneElse}
          change={onChange}
        />
      )
    });
  });

  listObjectExtraKeys.forEach(rawKey => {
    const prop = fieldProps.find(p => p.prop === rawKey);
    if (!prop) return;
    const label = `Элементы: ${prop.label}`;
    const value =
      values.extra?.listObjectExtra?.[
        rawKey as keyof NonNullable<
          NonNullable<FieldType["extra"]>["listObjectExtra"]
        >
      ] ?? "";
    fields.push({
      id: `listObjectExtra-${rawKey}`,
      render: () => (
        <prop.component
          prop={`listObjectExtra-${rawKey}` as EditableKey}
          label={label}
          value={value}
          lockField={stableLock}
          isLockedBySomeoneElse={isLockedBySomeoneElse}
          change={onChange}
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
        opacity: { duration: total * 0.03 + 0.15, type: "spring", bounce: 0.5 },
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
