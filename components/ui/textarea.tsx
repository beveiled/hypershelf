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
import * as React from "react";
import { cn } from "@/lib/utils";

type TextareaProps = React.ComponentProps<"textarea"> & {
  autosizeFrom?: number;
  autosizeTo?: number;
  minRows?: number;
  maxRows?: number;
};

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      style,
      autosizeFrom,
      autosizeTo,
      minRows,
      maxRows,
      onInput,
      value,
      placeholder,
      ...props
    },
    forwardedRef
  ) => {
    const ref = React.useRef<HTMLTextAreaElement>(null);
    const sizerRef = React.useRef<HTMLDivElement>(null);

    const measure = React.useCallback(() => {
      const el = ref.current;
      const sizer = sizerRef.current;
      if (!el || !sizer) return;

      const cs = window.getComputedStyle(el);

      sizer.style.font = cs.font;
      sizer.style.fontWeight = cs.fontWeight;
      sizer.style.fontStyle = cs.fontStyle;
      sizer.style.letterSpacing = cs.letterSpacing;
      sizer.style.textTransform = cs.textTransform;
      sizer.style.padding = cs.padding;
      sizer.style.width = "auto";
      sizer.style.whiteSpace = "pre-wrap";
      sizer.style.wordWrap = "break-word";

      const text =
        (value != null ? String(value) : el.value) || placeholder || "";
      sizer.textContent = text || " ";

      const lineHeight =
        parseFloat(cs.lineHeight) || sizer.getBoundingClientRect().height;
      const borderY =
        (parseFloat(cs.borderTopWidth) || 0) +
        (parseFloat(cs.borderBottomWidth) || 0);
      const minH = minRows
        ? Math.ceil(lineHeight * minRows + borderY)
        : undefined;
      const maxH = maxRows
        ? Math.floor(lineHeight * maxRows + borderY)
        : undefined;
      const measuredH = sizer.scrollHeight + borderY;
      const clampedH = Math.min(
        maxH ?? measuredH,
        Math.max(measuredH, minH ?? measuredH)
      );
      el.style.height = `${clampedH}px`;
      el.style.overflowY = maxH && clampedH >= maxH ? "auto" : "hidden";

      const measuredW = Math.ceil(sizer.scrollWidth + 1);
      const minW = autosizeFrom ?? measuredW;
      const maxW = autosizeTo ?? measuredW;
      const clampedW = Math.min(maxW, Math.max(measuredW, minW));
      el.style.width = `${clampedW}px`;
      el.style.overflowX =
        autosizeTo && clampedW >= autosizeTo ? "auto" : "hidden";
    }, [autosizeFrom, autosizeTo, minRows, maxRows, value, placeholder]);

    const setRefs = React.useCallback(
      (node: HTMLTextAreaElement | null) => {
        ref.current = node;
        if (typeof forwardedRef === "function") forwardedRef(node);
        else if (forwardedRef)
          (
            forwardedRef as React.RefObject<HTMLTextAreaElement | null>
          ).current = node;
        if (node) measure();
      },
      [forwardedRef, measure]
    );

    React.useLayoutEffect(() => {
      measure();
    }, [measure]);

    const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
      if (onInput) onInput(e);
      measure();
    };

    return (
      <>
        <textarea
          ref={setRefs}
          data-slot="textarea"
          value={value}
          placeholder={placeholder}
          onInput={handleInput}
          className={cn(
            "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            className
          )}
          style={{
            ...style,
            resize: "none",
            ...(autosizeFrom ? { minWidth: autosizeFrom } : {}),
            ...(autosizeTo ? { maxWidth: autosizeTo } : {}),
            overflowX: "hidden",
            overflowY: "hidden"
          }}
          {...props}
        />
        {/* TODO: Use scrollWidth instead of sizer for stability */}
        <div
          ref={sizerRef}
          aria-hidden="true"
          style={{
            position: "absolute",
            visibility: "hidden",
            height: "auto",
            whiteSpace: "pre-wrap",
            wordWrap: "break-word",
            ...(autosizeFrom ? { minWidth: autosizeFrom } : {}),
            ...(autosizeTo ? { maxWidth: autosizeTo } : {})
          }}
        />
      </>
    );
  }
);

Textarea.displayName = "Textarea";

export { Textarea };
