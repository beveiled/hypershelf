import type { Ref } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { AnimatePresence, motion } from "framer-motion";
import { isEqual } from "lodash";
import { Loader2, Save, X } from "lucide-react";
import { useStoreWithEqualityFn } from "zustand/traditional";

import type { Id } from "@hypershelf/convex/_generated/dataModel";
import { api } from "@hypershelf/convex/_generated/api";
import { validateField } from "@hypershelf/convex/utils";
import { useHypershelf } from "@hypershelf/lib/stores";
import { cn } from "@hypershelf/lib/utils";

import { ButtonWithKbd } from "../primitives/kbd-button";
import { Textarea } from "../primitives/textarea";

export function ActionsRow({
  showButton,
  error,
  updating,
  handleSave,
  handleCancel,
  measure,
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
  const [innerWidth, setInnerWidth] = useState<number>(0);
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
      setInnerWidth(window.innerWidth);
      setParentRect(parentEl.getBoundingClientRect());
    });

    resizeObserver.observe(measureEl);
    resizeObserver.observe(parentEl);

    setRect(measureEl.getBoundingClientRect());
    setParentRect(parentEl.getBoundingClientRect());
    setInnerWidth(window.innerWidth);

    return () => {
      resizeObserver.disconnect();
    };
  }, [measure]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (showButton && e.key === "Escape") {
        handleCancel();
        (document.activeElement as HTMLElement).blur();
      }
      if (
        !error &&
        !updating &&
        showButton &&
        (e.metaKey || e.ctrlKey) &&
        (e.key === "s" || e.key === "ы")
      ) {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("keydown", handler);
    };
  }, [error, handleCancel, handleSave, showButton, updating]);

  const side = useMemo(() => {
    return innerWidth - (rect?.right ?? 0) > 200 ? "right" : "left";
  }, [innerWidth, rect]);

  if (!rect || !parentRect) return null;

  return (
    <AnimatePresence>
      {(showButton || error) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.4 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.4 }}
          transition={{
            opacity: { duration: 0.2 },
            scale: { type: "spring", bounce: 0.3, duration: 0.4 },
          }}
          className={cn(
            "p-2 backdrop-blur-lg absolute z-40 flex min-w-fit flex-col justify-end rounded-md border border-dashed border-border-focus bg-background/80",
            side === "right" ? "origin-top-left" : "origin-top-right",
          )}
          style={{
            top: rect.top - parentRect.top - 10,
            left:
              side === "right" ? rect.left - parentRect.left - 10 : undefined,
            right:
              side === "right" ? undefined : parentRect.right - rect.right - 10,
            width: Math.max(rect.width + 18, 200),
            height: `calc(${rect.height + 18}px + ${(showButton ? 2.375 : 0) + (error ? 1.25 : 0)}rem)`,
          }}
        >
          {error && (
            <div className="px-0.5 text-xs text-red-500 whitespace-pre">
              {error}
            </div>
          )}
          {error && showButton && <div className="h-1" />}
          {showButton && (
            <div className="gap-2 flex w-full items-center">
              <ButtonWithKbd
                variant="outline"
                size="sm"
                className="!p-1 text-xs h-auto"
                onClick={handleCancel}
                disabled={updating}
                keys={["Esc"]}
                showKbd={!updating}
                kbdSize="sm"
              >
                <X />
                Отмена
              </ButtonWithKbd>
              <ButtonWithKbd
                size="sm"
                className={cn(
                  "py-1 text-xs h-auto flex-1",
                  !!error && "cursor-not-allowed",
                )}
                onClick={handleSave}
                disabled={updating || !!error}
                keys={["Meta", "S"]}
                showKbd={!updating && !error}
                kbdSize="sm"
              >
                {updating ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <Save className="size-3" />
                )}
                Сохранить
              </ButtonWithKbd>
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
  readonly = false,
  maxRows = 10,
}: {
  assetId: Id<"assets">;
  fieldId: Id<"fields">;
  readonly?: boolean;
  maxRows?: number;
}) {
  const fieldInfo = useStoreWithEqualityFn(
    useHypershelf,
    (state) => ({
      type: state.fields[fieldId]?.field.type ?? "string",
      extra: state.fields[fieldId]?.field.extra,
      required: state.fields[fieldId]?.field.required,
    }),
    isEqual,
  );
  const { placeholder } = fieldInfo.extra ?? {};
  const value = useHypershelf(
    (state) => state.assets[assetId]?.asset.metadata?.[fieldId],
  );
  const lockedBy = useHypershelf(
    (state) => state.lockedFields[assetId]?.[fieldId],
  );
  const lazyError = useHypershelf(
    (state) => state.assetErrors[assetId]?.[fieldId],
  );

  const [val, setVal] = useState(value?.toString() ?? "");
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const measure = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isDirty && !isFocused && !error) {
      const storeValue = value?.toString() ?? "";
      if (val !== storeValue) {
        setVal(storeValue);
        setError(null);
      }
    }
  }, [value, isDirty, isFocused, val, error]);

  const showButton = useMemo(() => isDirty, [isDirty]);
  const updateAsset = useMutation(api.assets.update);

  const handleSave = () => {
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
        .catch(() => setError("Не смогли сохранить! Смотри консоль!"))
        .finally(() => {
          setUpdating(false);
          const locker = useHypershelf.getState().assetsLocker;
          void locker.release(assetId, fieldId);
        });
    }
  };

  const handleCancel = () => {
    setVal(value?.toString() ?? "");
    setError(null);
    setIsDirty(false);
    const locker = useHypershelf.getState().assetsLocker;
    void locker.release(assetId, fieldId);
  };

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      setVal(newValue);
      const dirty = newValue !== (value?.toString() ?? "");
      setIsDirty(dirty);
      const locker = useHypershelf.getState().assetsLocker;
      if (dirty) {
        void locker.acquire(assetId, fieldId);
      } else {
        void locker.release(assetId, fieldId);
      }
      setError(validateField(fieldInfo, newValue));
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
    <div className="gap-2 flex flex-col">
      <div ref={measure}>
        {lockedBy && (
          <span className="-mt-0.5 absolute -translate-y-full text-[10px] whitespace-pre text-brand">
            {lockedBy}
          </span>
        )}
        <Textarea
          value={val}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            if (val === (value?.toString() ?? "")) {
              setError(null);
            }
            setIsFocused(false);
          }}
          placeholder={isFocused ? (placeholder ?? "Пиши тут...") : "пусто"}
          className={cn(
            "py-1 text-sm ease-in-out relative h-auto !border-0 !bg-transparent text-center shadow-none transition-shadow duration-200",
            (error ?? (lazyError && !isDirty && isFocused)) &&
              "!ring-red-500 !ring-2",
            updating && "animate-pulse opacity-50",
            !isFocused && !val && "italic !placeholder-muted-foreground/50",
            lockedBy &&
              "cursor-not-allowed text-foreground/70 !opacity-100 ring-2 ring-brand",
            ((isDirty || error) ?? (lazyError && isFocused && !isDirty)) &&
              "z-50",
            lazyError &&
              !isDirty &&
              !isFocused &&
              "!border-red-500 rounded-br-none rounded-bl-none !border-b-2",
          )}
          disabled={updating || !!lockedBy}
          autosizeFrom={40}
          autosizeTo={384}
          minRows={1}
          maxRows={maxRows}
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

export function AnimateTransition({
  children,
  assetId,
  fieldId,
  postfix,
}: {
  children: React.ReactNode;
  assetId?: Id<"assets">;
  fieldId?: Id<"fields">;
  postfix?: string;
}) {
  const uniqueId = useMemo(
    () =>
      fieldId && assetId
        ? `field-${fieldId}-asset-${assetId}${postfix ? `-${postfix}` : ""}`
        : fieldId
          ? `field-${fieldId}${postfix ? `-${postfix}` : ""}`
          : assetId
            ? `asset-${assetId}${postfix ? `-${postfix}` : ""}`
            : postfix,
    [assetId, fieldId, postfix],
  );
  return (
    <motion.div
      layout
      layoutId={uniqueId}
      transition={{ type: "spring", bounce: 0.05, duration: 0.1 }}
    >
      {children}
    </motion.div>
  );
}
