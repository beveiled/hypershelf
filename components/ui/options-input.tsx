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

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { GripVertical, Plus, Trash } from "lucide-react";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { SortableItem } from "./sortable-item";

type OptionsInputProps = {
  options: string[];
  onChange: (options: string[]) => void;
  disabled?: boolean;
  onFocus?: () => void;
};

type Row = { id: string; value: string };

const OptionRow = memo(
  function OptionRow({
    id,
    value,
    disabled,
    onFocus,
    onChangeValue,
    onRemove
  }: {
    id: string;
    value: string;
    disabled: boolean;
    onFocus?: () => void;
    onChangeValue: (id: string, v: string) => void;
    onRemove: (id: string) => void;
  }) {
    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        onChangeValue(id, e.target.value);
      },
      [id, onChangeValue]
    );

    const handleRemove = useCallback(() => {
      onFocus?.();
      onRemove(id);
    }, [id, onRemove, onFocus]);

    return (
      <SortableItem id={id}>
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="size-7 cursor-grab"
            disabled={disabled}
            onClick={onFocus}
          >
            <GripVertical className="size-3" />
          </Button>
          <Input
            value={value}
            onChange={handleChange}
            placeholder="Option"
            className="h-auto flex-1 py-1 text-xs"
            disabled={disabled}
            onFocus={onFocus}
          />
          <Button
            size="icon"
            variant="ghost"
            onClick={handleRemove}
            className="size-7"
            disabled={disabled}
          >
            <Trash className="size-3" />
          </Button>
        </div>
      </SortableItem>
    );
  },
  (a, b) =>
    a.value === b.value &&
    a.disabled === b.disabled &&
    a.id === b.id &&
    a.onFocus === b.onFocus &&
    a.onChangeValue === b.onChangeValue &&
    a.onRemove === b.onRemove
);

const genId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `opt_${Math.random().toString(36).slice(2)}`;

export const OptionsInput: React.FC<OptionsInputProps> = ({
  options,
  onChange,
  onFocus,
  disabled = false
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const [rows, setRows] = useState<Row[]>(() =>
    options.map(v => ({ id: genId(), value: v }))
  );
  const [itemIds, setItemIds] = useState<string[]>(() => rows.map(r => r.id));
  const isEditingRef = useRef(false);
  const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isEditingRef.current) return;
    const next = options.map(v => ({ id: genId(), value: v }));
    setRows(next);
    setItemIds(next.map(r => r.id));
  }, [options]);

  const emit = useCallback(
    (next: Row[]) => {
      onChange(next.map(r => r.value));
    },
    [onChange]
  );

  const emitDebounced = useCallback(
    (next: Row[]) => {
      if (flushTimer.current) clearTimeout(flushTimer.current);
      flushTimer.current = setTimeout(() => emit(next), 200);
    },
    [emit]
  );

  useEffect(() => {
    return () => {
      if (flushTimer.current) clearTimeout(flushTimer.current);
    };
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = rows.findIndex(r => r.id === String(active.id));
      const newIndex = rows.findIndex(r => r.id === String(over.id));
      const next = arrayMove(rows, oldIndex, newIndex);
      setRows(next);
      setItemIds(next.map(r => r.id));
      emit(next);
    },
    [rows, emit]
  );

  const addOption = useCallback(() => {
    onFocus?.();
    const next = [...rows, { id: genId(), value: "" }];
    setRows(next);
    setItemIds(next.map(r => r.id));
    emit(next);
  }, [rows, emit, onFocus]);

  const updateOption = useCallback(
    (id: string, v: string) => {
      isEditingRef.current = true;
      const next = rows.map(r => (r.id === id ? { ...r, value: v } : r));
      setRows(next);
      emitDebounced(next);
    },
    [rows, emitDebounced]
  );

  const removeOption = useCallback(
    (id: string) => {
      const next = rows.filter(r => r.id !== id);
      setRows(next);
      setItemIds(next.map(r => r.id));
      emit(next);
    },
    [rows, emit]
  );

  const items = itemIds;

  return (
    <div className="flex flex-col gap-2">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items}
          strategy={verticalListSortingStrategy}
          disabled={disabled}
        >
          {rows.map(r => (
            <OptionRow
              key={r.id}
              id={r.id}
              value={r.value}
              disabled={disabled}
              onFocus={() => {
                isEditingRef.current = true;
                onFocus?.();
              }}
              onChangeValue={updateOption}
              onRemove={removeOption}
            />
          ))}
        </SortableContext>
      </DndContext>

      <Button
        size="sm"
        onClick={addOption}
        className="w-fit"
        disabled={disabled}
      >
        <Plus className="h-4 w-4" /> Добавить
      </Button>
    </div>
  );
};
