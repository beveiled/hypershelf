import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { validateField } from "@/convex/utils";
import { cn } from "@/lib/utils";
import { useHypershelf } from "@/stores";
import { FieldPropConfig } from "./_abstractType";
import { ActionsRow } from "./_shared";
import { useMutation } from "convex/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useShallow } from "zustand/shallow";

export function InlineString({
  assetId,
  fieldId,
  readonly = false,
}: {
  assetId: Id<"assets">;
  fieldId: Id<"fields">;
  readonly?: boolean;
}) {
  const fieldInfo = useHypershelf(
    useShallow(state => ({
      type: state.fields?.[fieldId]?.field?.type,
      extra: state.fields?.[fieldId]?.field?.extra,
      required: state.fields?.[fieldId]?.field?.required,
    })),
  );
  const { placeholder } = fieldInfo?.extra || {};
  const value = useHypershelf(
    state => state.assets?.[assetId]?.asset?.metadata?.[fieldId],
  );
  const lockedBy = useHypershelf(
    state => state.lockedFields?.[assetId]?.[fieldId],
  );
  const lazyError = useHypershelf(
    state => state.assetErrors?.[assetId]?.[fieldId],
  );

  const [val, setVal] = useState(value?.toString() || "");
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const measure = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isDirty && !isFocused && !error) {
      const storeValue = value?.toString() || "";
      if (val !== storeValue) {
        setVal(storeValue);
        setError(null);
      }
    }
  }, [value, isDirty, isFocused, val, error]);

  const showButton = useMemo(() => isDirty, [isDirty]);
  const updateAsset = useMutation(api.assets.update);

  const handleSave = () => {
    if (!fieldInfo) return;
    if (val !== value?.toString()) {
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
        .finally(() => {
          setUpdating(false);
          const locker = useHypershelf.getState().assetsLocker;
          locker.release(assetId, fieldId);
        });
    }
  };

  const handleCancel = () => {
    setVal(value?.toString() || "");
    setError(null);
    setIsDirty(false);
    const locker = useHypershelf.getState().assetsLocker;
    locker.release(assetId, fieldId);
  };

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      setVal(newValue);
      const dirty = newValue !== (value?.toString() || "");
      setIsDirty(dirty);
      const locker = useHypershelf.getState().assetsLocker;
      if (dirty) {
        locker.acquire(assetId, fieldId);
      } else {
        locker.release(assetId, fieldId);
      }
      if (fieldInfo) {
        setError(validateField(fieldInfo, newValue));
      }
    },
    [assetId, fieldInfo, fieldId, value],
  );

  if (readonly) {
    return (
      <div className={cn(!val && "text-muted-foreground/50 italic")}>
        {val || "пусто"}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div ref={measure}>
        {lockedBy && (
          <span className="text-brand absolute -mt-0.5 -translate-y-full text-[10px] whitespace-pre">
            {lockedBy}
          </span>
        )}
        <Textarea
          value={val}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            if (val === (value?.toString() || "")) {
              setError(null);
            }
            setIsFocused(false);
          }}
          placeholder={isFocused ? placeholder || "Пиши тут..." : "пусто"}
          className={cn(
            "relative h-auto !border-0 !bg-transparent py-1 text-center text-sm shadow-none transition-shadow duration-200 ease-in-out",
            (error || (lazyError && !isDirty && isFocused)) &&
              "!ring-2 !ring-red-500",
            updating && "animate-pulse opacity-50",
            !isFocused && !val && "!placeholder-muted-foreground/50 italic",
            lockedBy &&
              "text-foreground/70 ring-brand cursor-not-allowed !opacity-100 ring-2",
            (isDirty || error || (lazyError && isFocused && !isDirty)) &&
              "z-50",
            lazyError &&
              !isDirty &&
              !isFocused &&
              "rounded-br-none rounded-bl-none !border-b-2 !border-red-500",
          )}
          disabled={updating || !!lockedBy}
          autosizeFrom={40}
          autosizeTo={384}
          minRows={1}
          maxRows={10}
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

const config = {
  key: "string",
  label: "Строка",
  icon: "case-sensitive",
  fieldProps: ["placeholder", "regex", "regexError", "minLength", "maxLength"],
  component: InlineString,
} as const satisfies FieldPropConfig;

export default config;
