import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { isEqual } from "lodash";
import { useStoreWithEqualityFn } from "zustand/traditional";

import type { Id } from "@hypershelf/convex/_generated/dataModel";
import type { ValueType } from "@hypershelf/convex/schema";
import { api } from "@hypershelf/convex/_generated/api";
import { validateField } from "@hypershelf/convex/utils";
import { useHypershelf } from "@hypershelf/lib/stores";
import { cn } from "@hypershelf/lib/utils";

import type { FieldPropConfig } from "./_abstractType";
import { TagInput } from "../primitives/tag-input";
import { toast } from "../Toast";
import { ActionsRow } from "./_shared";

export function InlineArray({
  assetId,
  fieldId,
  readonly = false,
}: {
  assetId: Id<"assets">;
  fieldId: Id<"fields">;
  readonly?: boolean;
}) {
  const fieldInfo = useStoreWithEqualityFn(
    useHypershelf,
    (state) => ({
      type: state.fields[fieldId]?.field.type ?? "array",
      extra: state.fields[fieldId]?.field.extra,
      required: state.fields[fieldId]?.field.required,
    }),
    isEqual,
  );
  const { placeholder } = fieldInfo.extra ?? {};
  const value = useStoreWithEqualityFn(
    useHypershelf,
    (state) => state.assets[assetId]?.asset.metadata?.[fieldId] ?? [],
    isEqual,
  );
  const lockedBy = useHypershelf(
    (state) => state.lockedFields[assetId]?.[fieldId],
  );
  const lazyError = useHypershelf(
    (state) => state.assetErrors[assetId]?.[fieldId],
  );

  const [val, setVal] = useState(value);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const measure = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isDirty) {
      if (!isEqual(val, value)) {
        setVal(value);
        setError(null);
      }
    }
  }, [value, isDirty, val]);

  const showButton = useMemo(() => isDirty, [isDirty]);
  const updateAsset = useMutation(api.assets.update);

  const handleSave = () => {
    if (!isEqual(val, value)) {
      const validationError = validateField(fieldInfo, val);
      if (validationError) {
        setError(validationError);
        return;
      }

      setError(null);
      setUpdating(true);
      updateAsset({
        assetId,
        fieldId,
        value: val,
      })
        .then(() => setIsDirty(false))
        .catch((e) => {
          console.error("Failed to update asset:", e);
          toast.error("Не смогли сохранить поле!");
        })
        .finally(() => {
          setUpdating(false);
          const locker = useHypershelf.getState().assetsLocker;
          void locker.release(assetId, fieldId);
        });
    }
  };

  const handleCancel = () => {
    setVal(value);
    setError(null);
    setIsDirty(false);
    const locker = useHypershelf.getState().assetsLocker;
    void locker.release(assetId, fieldId);
  };

  const onChange = useCallback(
    (incoming: string[]) => {
      setVal(incoming);
      const dirty = !isEqual(incoming, value);
      setIsDirty(dirty);
      const locker = useHypershelf.getState().assetsLocker;
      if (dirty) {
        void locker.acquire(assetId, fieldId);
      } else {
        void locker.release(assetId, fieldId);
      }
      setError(validateField(fieldInfo, incoming));
    },
    [assetId, fieldInfo, fieldId, value],
  );

  const validateTag = useCallback(
    (tag: string) => {
      if (fieldInfo.extra?.listObjectType) {
        if (fieldInfo.extra.listObjectType === "number" && isNaN(Number(tag)))
          return false;
        if (
          fieldInfo.extra.listObjectType === "string" &&
          fieldInfo.extra.listObjectExtra?.regex &&
          !new RegExp(fieldInfo.extra.listObjectExtra.regex).test(tag)
        )
          return false;
        if (
          fieldInfo.extra.listObjectType === "string" &&
          fieldInfo.extra.listObjectExtra?.minLength &&
          tag.length < fieldInfo.extra.listObjectExtra.minLength
        )
          return false;
        if (
          fieldInfo.extra.listObjectType === "string" &&
          fieldInfo.extra.listObjectExtra?.maxLength &&
          tag.length > fieldInfo.extra.listObjectExtra.maxLength
        )
          return false;
        if (
          fieldInfo.extra.listObjectType === "number" &&
          fieldInfo.extra.listObjectExtra?.minValue !== undefined &&
          Number(tag) < fieldInfo.extra.listObjectExtra.minValue
        )
          return false;
        if (
          fieldInfo.extra.listObjectType === "number" &&
          fieldInfo.extra.listObjectExtra?.maxValue !== undefined &&
          Number(tag) > fieldInfo.extra.listObjectExtra.maxValue
        )
          return false;
      }
      return true;
    },
    [fieldInfo],
  );

  if (readonly) {
    return val && Array.isArray(val) && val.length > 0 ? (
      <div>{(val as ValueType[]).join(", ")}</div>
    ) : (
      <div className="text-muted-foreground/50 italic">пусто</div>
    );
  }

  return (
    <div className="gap-2 flex flex-col">
      <div ref={measure}>
        {lockedBy && (
          <span className="-mt-0.5 absolute -translate-y-full text-[10px] text-brand">
            {lockedBy}
          </span>
        )}
        <TagInput
          tags={val as string[]}
          setTags={onChange}
          placeholder={placeholder ?? "Добавить..."}
          className={cn(
            "py-1 text-sm relative h-auto !border-0 !bg-transparent",
            (error ?? (lazyError && !isDirty && isFocused)) &&
              "!ring-red-500 !ring-2",
            updating && "animate-pulse opacity-50",
            !val && "italic !placeholder-muted-foreground/50",
            lockedBy &&
              "cursor-not-allowed text-foreground/70 !opacity-100 ring-2 ring-brand",
            ((isDirty || error) ?? (lazyError && isFocused && !isDirty)) &&
              "z-50",
            lazyError &&
              !isDirty &&
              !isFocused &&
              "!border-red-500 rounded-br-none rounded-bl-none !border-b-2",
          )}
          draggable
          disabled={!!lockedBy || updating}
          validateTag={validateTag}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            if (val === (value || [])) {
              setError(null);
            }
            setIsFocused(false);
          }}
        />
      </div>
      <ActionsRow
        showButton={
          showButton || !!error || (!!lazyError && isFocused && !isDirty)
        }
        error={error ?? (isFocused && !isDirty ? lazyError : null) ?? null}
        updating={updating}
        handleSave={handleSave}
        handleCancel={handleCancel}
        measure={measure}
      />
    </div>
  );
}

const config = {
  key: "array",
  label: "Список",
  icon: "brackets",
  fieldProps: [
    "placeholder",
    "minItems",
    "maxItems",
    "listObjectType",
    "listObjectExtra",
  ],
  component: InlineArray,
} as const satisfies FieldPropConfig;

export default config;
