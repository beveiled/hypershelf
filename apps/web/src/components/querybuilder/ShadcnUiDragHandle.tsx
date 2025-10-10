import type { ComponentPropsWithRef } from "react";
import type { DragHandleProps } from "react-querybuilder";
import { forwardRef } from "react";
import { GripVertical } from "lucide-react";

export type ShadcnUiDragHandleProps = DragHandleProps &
  ComponentPropsWithRef<"span">;

export const ShadcnUiDragHandle = forwardRef<
  HTMLSpanElement,
  ShadcnUiDragHandleProps
>(({ className, title }, dragRef) => (
  <span ref={dragRef} className={className} title={title}>
    <GripVertical className="size-5 text-input" />
  </span>
));

ShadcnUiDragHandle.displayName = "ShadcnUiDragHandle";
