"use client";

import type { DragEndEvent } from "@dnd-kit/core";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { GripVertical, Plus, Trash } from "lucide-react";

import { Button } from "./button";
import { Input } from "./input";
import { SortableItem } from "./sortable-item";

interface OptionsInputProps {
  options: string[] | undefined;
  onChange: (options: string[]) => void;
  disabled?: boolean;
  onFocus?: () => void;
}

interface Row {
  id: string;
  value: string;
}

const OptionRow = memo(
  function OptionRow({
    id,
    value,
    disabled,
    onFocus,
    onChangeValue,
    onRemove,
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
      [id, onChangeValue],
    );

    const handleRemove = useCallback(() => {
      onFocus?.();
      onRemove(id);
    }, [id, onRemove, onFocus]);

    return (
      <div className="gap-1 flex items-center">
        <SortableItem id={id}>
          <Button
            size="icon"
            variant="ghost"
            className="size-7 cursor-grab"
            disabled={disabled}
            onClick={onFocus}
          >
            <GripVertical className="size-3" />
          </Button>
        </SortableItem>
        <Input
          value={value}
          onChange={handleChange}
          placeholder="Option"
          className="py-1 text-xs h-auto flex-1"
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
    );
  },
  (a, b) =>
    a.value === b.value &&
    a.disabled === b.disabled &&
    a.id === b.id &&
    a.onFocus === b.onFocus &&
    a.onChangeValue === b.onChangeValue &&
    a.onRemove === b.onRemove,
);

const genId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `opt_${Math.random().toString(36).slice(2)}`;

export const OptionsInput: React.FC<OptionsInputProps> = ({
  options,
  onChange,
  onFocus,
  disabled = false,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const [rows, setRows] = useState<Row[]>(() =>
    options ? options.map((v) => ({ id: genId(), value: v })) : [],
  );
  const [itemIds, setItemIds] = useState<string[]>(() => rows.map((r) => r.id));
  const isEditingRef = useRef(false);
  const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isEditingRef.current) return;
    const next = options ? options.map((v) => ({ id: genId(), value: v })) : [];
    setRows(next);
    setItemIds(next.map((r) => r.id));
  }, [options]);

  const emit = useCallback(
    (next: Row[]) => {
      onChange(next.map((r) => r.value));
    },
    [onChange],
  );

  const emitDebounced = useCallback(
    (next: Row[]) => {
      if (flushTimer.current) clearTimeout(flushTimer.current);
      flushTimer.current = setTimeout(() => emit(next), 200);
    },
    [emit],
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
      const oldIndex = rows.findIndex((r) => r.id === String(active.id));
      const newIndex = rows.findIndex((r) => r.id === String(over.id));
      const next = arrayMove(rows, oldIndex, newIndex);
      setRows(next);
      setItemIds(next.map((r) => r.id));
      emit(next);
    },
    [rows, emit],
  );

  const addOption = useCallback(() => {
    onFocus?.();
    const next = [...rows, { id: genId(), value: "" }];
    setRows(next);
    setItemIds(next.map((r) => r.id));
    emit(next);
  }, [rows, emit, onFocus]);

  const updateOption = useCallback(
    (id: string, v: string) => {
      isEditingRef.current = true;
      const next = rows.map((r) => (r.id === id ? { ...r, value: v } : r));
      setRows(next);
      emitDebounced(next);
    },
    [rows, emitDebounced],
  );

  const removeOption = useCallback(
    (id: string) => {
      const next = rows.filter((r) => r.id !== id);
      setRows(next);
      setItemIds(next.map((r) => r.id));
      emit(next);
    },
    [rows, emit],
  );

  const items = itemIds;

  return (
    <div className="gap-2 flex flex-col">
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
          {rows.map((r) => (
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
        <Plus className="size-4" /> Добавить
      </Button>
    </div>
  );
};
