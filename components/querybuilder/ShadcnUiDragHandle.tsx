/*
https://github.com/hikariatama/hypershelf
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
import { GripVertical } from "lucide-react";
import type { ComponentPropsWithRef } from "react";
import { forwardRef } from "react";
import type { DragHandleProps } from "react-querybuilder";

export type ShadcnUiDragHandleProps = DragHandleProps &
  ComponentPropsWithRef<"span">;

export const ShadcnUiDragHandle = forwardRef<
  HTMLSpanElement,
  ShadcnUiDragHandleProps
>(({ className, title }, dragRef) => (
  <span ref={dragRef} className={className} title={title}>
    <GripVertical className="text-input h-5 w-5" />
  </span>
));

ShadcnUiDragHandle.displayName = "ShadcnUiDragHandle";
