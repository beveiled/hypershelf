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
import { TagInput } from "@/components/ui/tag-input";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { validateField } from "@/convex/utils";
import { cn, shallowPositional } from "@/lib/utils";
import { useHypershelf } from "@/stores/assets";
import { useMutation } from "convex/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useShallow } from "zustand/shallow";
import { FieldPropConfig } from "./_abstractType";
import { ActionsRow } from "./string";

export function InlineArray({
  assetId,
  fieldId,
  readonly = false
}: {
  assetId: Id<"assets">;
  fieldId: Id<"fields">;
  readonly?: boolean;
}) {
  const fieldInfo = useHypershelf(
    useShallow(state => ({
      type: state.fields?.[fieldId]?.type,
      extra: state.fields?.[fieldId]?.extra,
      required: state.fields?.[fieldId]?.required
    }))
  );
  const { placeholder } = fieldInfo?.extra || {};
  const value = useHypershelf(
    useShallow(
      state => state.assets?.[assetId]?.asset?.metadata?.[fieldId] ?? []
    )
  );
  const lockedBy = useHypershelf(
    state => state.lockedFields?.[assetId]?.[fieldId]
  );
  const lazyError = useHypershelf(
    state => state.assetErrors?.[assetId]?.[fieldId]
  );

  const [val, setVal] = useState(value);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const measure = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isDirty) {
      if (!shallowPositional(val, value)) {
        setVal(value);
        setError(null);
      }
    }
  }, [value, isDirty, val]);

  const showButton = useMemo(() => isDirty, [isDirty]);
  const updateAsset = useMutation(api.assets.update);

  const handleSave = () => {
    if (!fieldInfo) return;
    if (!shallowPositional(val, value)) {
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
        value: val
      })
        .then(() => setIsDirty(false))
        .finally(() => {
          setUpdating(false);
          const locker = useHypershelf.getState().locker;
          locker.release(assetId, fieldId);
        });
    }
  };

  const handleCancel = () => {
    setVal(value);
    setError(null);
    setIsDirty(false);
    const locker = useHypershelf.getState().locker;
    locker.release(assetId, fieldId);
  };

  const onChange = useCallback(
    (incoming: string[]) => {
      setVal(incoming);
      const dirty = !shallowPositional(incoming, value);
      setIsDirty(dirty);
      const locker = useHypershelf.getState().locker;
      if (dirty) {
        locker.acquire(assetId, fieldId);
      } else {
        locker.release(assetId, fieldId);
      }
      if (fieldInfo) {
        setError(validateField(fieldInfo, incoming));
      }
    },
    [assetId, fieldInfo, fieldId, value]
  );

  const validateTag = useCallback(
    (tag: string) => {
      if (fieldInfo.extra?.listObjectType) {
        if (fieldInfo.extra?.listObjectType === "number" && isNaN(Number(tag)))
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
    [fieldInfo]
  );

  if (readonly) {
    return (
      <div
        className={cn("select-none", !val && "text-muted-foreground/50 italic")}
      >
        {val || placeholder || "пусто"}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div ref={measure}>
        {lockedBy && (
          <span className="text-brand absolute -mt-0.5 -translate-y-full text-[10px]">
            {lockedBy}
          </span>
        )}
        <TagInput
          tags={val}
          setTags={onChange}
          placeholder={placeholder || "Добавить..."}
          className={cn(
            "relative h-auto !border-0 !bg-transparent py-1 text-sm",
            (error || (lazyError && !isDirty && isFocused)) &&
              "!ring-2 !ring-red-500",
            updating && "animate-pulse opacity-50",
            !val && "!placeholder-muted-foreground/50 italic",
            lockedBy &&
              "text-foreground/70 ring-brand cursor-not-allowed !opacity-100 ring-2",
            (isDirty || error || (lazyError && isFocused && !isDirty)) &&
              "z-50",
            lazyError &&
              !isDirty &&
              !isFocused &&
              "rounded-br-none rounded-bl-none !border-b-2 border-red-500"
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
        error={error || (isFocused && !isDirty ? lazyError : null)}
        updating={updating}
        handleSave={handleSave}
        handleCancel={handleCancel}
        measure={measure}
      />
    </div>
  );
}

const config: FieldPropConfig = {
  key: "array",
  label: "Список",
  icon: "brackets",
  fieldProps: [
    "placeholder",
    "minItems",
    "maxItems",
    "listObjectType",
    "listObjectExtra"
  ],
  component: InlineArray
};

export default config;
