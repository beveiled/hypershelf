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
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { validateField } from "@/convex/utils";
import { cn } from "@/lib/utils";
import { useHypershelf } from "@/stores/assets";
import { useMutation } from "convex/react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Save, X } from "lucide-react";
import { Ref, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useShallow } from "zustand/shallow";
import { FieldPropConfig } from "./_abstractType";

export function ActionsRow({
  showButton,
  error,
  updating,
  handleSave,
  handleCancel,
  measure
}: {
  showButton: boolean;
  error: string | null;
  updating: boolean;
  handleSave: () => void;
  handleCancel: () => void;
  measure: Ref<HTMLElement>;
}) {
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [parentRect, setParentRect] = useState<DOMRect | null>(null);
  useEffect(() => {
    const measureEl = measure && "current" in measure ? measure.current : null;
    if (!measureEl) return;

    let parentEl = measureEl.parentElement;
    while (parentEl && getComputedStyle(parentEl).position !== "relative") {
      parentEl = parentEl.parentElement;
    }

    if (!parentEl) return;

    const resizeObserver = new ResizeObserver(() => {
      setRect(measureEl.getBoundingClientRect());
      if (parentEl) {
        setParentRect(parentEl.getBoundingClientRect());
      }
    });

    resizeObserver.observe(measureEl);
    resizeObserver.observe(parentEl);

    setRect(measureEl.getBoundingClientRect());
    setParentRect(parentEl.getBoundingClientRect());

    return () => {
      resizeObserver.disconnect();
    };
  }, [measure]);

  if (!rect || !parentRect) return null;

  return (
    <AnimatePresence>
      {(showButton || error) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{
            opacity: { duration: 0.2 },
            scale: { type: "spring", bounce: 0.5, duration: 0.2 }
          }}
          className="border-border-focus bg-background/80 absolute z-40 flex min-w-fit flex-col justify-end rounded-md border border-dashed p-1 pt-0 backdrop-blur-lg"
          style={{
            top: rect.top - parentRect.top - 8,
            left: rect.left - parentRect.left - 8,
            width: Math.max(rect.width + 16, 150),
            height: `calc(${rect.height + 16}px + ${(showButton ? 2.125 : 0) + (error ? 1 : 0)}rem)`
          }}
        >
          {error && (
            <div className="px-1 text-xs whitespace-pre text-red-500">
              {error}
            </div>
          )}
          {error && showButton && <div className="h-1" />}
          {showButton && (
            <div className="flex w-full items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-auto flex-1 py-1 text-xs",
                  !!error && "cursor-not-allowed"
                )}
                onClick={handleSave}
                disabled={updating || !!error}
              >
                {updating ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <Save className="size-3" />
                )}
                Сохранить
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto !p-1 text-xs"
                onClick={handleCancel}
                disabled={updating}
              >
                <X />
              </Button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function InlineString({
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
    state => state.assets?.[assetId]?.asset?.metadata?.[fieldId]
  );
  const lockedBy = useHypershelf(
    state => state.lockedFields?.[assetId]?.[fieldId]
  );
  const lazyError = useHypershelf(
    state => state.assetErrors?.[assetId]?.[fieldId]
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
        value: val
      })
        .then(() => setIsDirty(false))
        .finally(() => setUpdating(false));
    }
  };

  const handleCancel = () => {
    setVal(value?.toString() || "");
    setError(null);
    setIsDirty(false);
    const locker = useHypershelf.getState().locker;
    locker.release(assetId, fieldId);
  };

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      setVal(newValue);
      const dirty = newValue !== (value?.toString() || "");
      setIsDirty(dirty);
      const locker = useHypershelf.getState().locker;
      if (dirty) {
        locker.acquire(assetId, fieldId);
      } else {
        locker.release(assetId, fieldId);
      }
      if (fieldInfo) {
        setError(validateField(fieldInfo, newValue));
      }
    },
    [assetId, fieldInfo, fieldId, value]
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
            "relative h-auto !border-0 !bg-transparent py-1 text-sm shadow-none",
            error && "!ring-2 !ring-red-500",
            updating && "animate-pulse opacity-50",
            !isFocused && !val && "!placeholder-muted-foreground/50 italic",
            lockedBy &&
              "text-foreground/70 ring-brand cursor-not-allowed !opacity-100 ring-2",
            (isDirty || error || (lazyError && isFocused)) && "z-50",
            lazyError &&
              !isDirty &&
              !isFocused &&
              "rounded-br-none rounded-bl-none !border-b-2 border-red-500"
          )}
          disabled={updating || !!lockedBy}
          autosizeFrom={60}
          autosizeTo={384}
          minRows={1}
          maxRows={10}
        />
      </div>
      <ActionsRow
        showButton={showButton || !!error || (!!lazyError && isFocused)}
        error={error || (isFocused ? lazyError : null)}
        updating={updating}
        handleSave={handleSave}
        handleCancel={handleCancel}
        measure={measure}
      />
    </div>
  );
}

const config: FieldPropConfig = {
  key: "string",
  label: "Строка",
  icon: "case-sensitive",
  fieldProps: ["placeholder", "regex", "regexError", "minLength", "maxLength"],
  component: InlineString
};

export default config;
