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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable
} from "@dnd-kit/sortable";
import { motion } from "framer-motion";
import { Plus, X } from "lucide-react";
import React, { KeyboardEvent, useState } from "react";
import { Textarea } from "./textarea";

const SortableTag: React.FC<{
  tag: string;
  onRemove: () => void;
  disabled: boolean;
}> = ({ tag, onRemove, disabled = false }) => {
  const { attributes, listeners, setNodeRef, transform } = useSortable({
    id: tag
  });

  return (
    <Badge
      variant="secondary"
      className="flex items-center gap-1 select-none"
      asChild
    >
      <motion.div
        initial={{ scale: 1 }}
        animate={{ x: transform?.x, y: transform?.y }}
        whileTap={{ scale: 0.9 }}
        transition={{
          duration: 0,
          scale: { type: "spring", bounce: 0.15, duration: 0.15 }
        }}
        ref={setNodeRef}
        {...attributes}
      >
        <span {...listeners} className="cursor-grab active:cursor-grabbing">
          {tag}
        </span>

        <Button
          type="button"
          size="icon"
          variant="secondary"
          onPointerDown={e => e.stopPropagation()}
          onClick={onRemove}
          className="h-4 w-4 p-0"
          disabled={disabled}
        >
          <X className="size-3" />
        </Button>
      </motion.div>
    </Badge>
  );
};

const StaticTag: React.FC<{
  tag: string;
  onRemove: () => void;
  disabled: boolean;
}> = ({ tag, onRemove, disabled = false }) => (
  <Badge variant="secondary" className="flex items-center gap-1 select-none">
    <span className="mr-0.5">{tag}</span>
    <Button
      type="button"
      size="icon"
      variant="ghost"
      onClick={onRemove}
      className="h-4 w-4 p-0"
      disabled={disabled}
    >
      <X className="size-3" />
    </Button>
  </Badge>
);

export function TagInput({
  tags,
  setTags,
  placeholder = "Add items...",
  className,
  uniqueId,
  draggable = true,
  validateTag = () => true,
  disabled = false
}: {
  tags: string[];
  setTags: (tags: string[]) => void;
  uniqueId: string;
  placeholder?: string;
  className?: string;
  draggable?: boolean;
  validateTag?: (tag: string) => boolean;
  disabled?: boolean;
}) {
  const [value, setValue] = useState("");
  const [isInvalid, setIsInvalid] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  const sensors = useSensors(useSensor(PointerSensor));

  const addTag = (raw: string) => {
    const text = raw.trim();
    if (text && !tags.includes(text)) {
      if (validateTag(text)) {
        setTags([...tags, text]);
        return true;
      } else {
        setIsInvalid(true);
        return false;
      }
    }
    return false;
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (!value.trim()) return;
      const success = addTag(value);
      if (success) {
        setValue("");
      }
    } else if (e.key === "Backspace" && !value && tags.length) {
      e.preventDefault();
      setTags(tags.slice(0, -1));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    if (isInvalid) {
      setIsInvalid(false);
    }
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const oldIdx = tags.indexOf(String(active.id));
    const newIdx = tags.indexOf(String(over.id));
    setTags(arrayMove(tags, oldIdx, newIdx));
  };

  const Tag = draggable ? SortableTag : StaticTag;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-1 rounded-md border p-2",
        className
      )}
    >
      {draggable ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <SortableContext
            items={tags}
            strategy={rectSortingStrategy}
            disabled={disabled}
          >
            {tags.map(t => (
              <Tag
                key={t}
                tag={t}
                onRemove={() => setTags(tags.filter(x => x !== t))}
                disabled={disabled}
              />
            ))}
          </SortableContext>
        </DndContext>
      ) : (
        tags.map(t => (
          <Tag
            key={t}
            tag={t}
            onRemove={() => setTags(tags.filter(x => x !== t))}
            disabled={disabled}
          />
        ))
      )}
      <motion.div
        className="flex-1"
        animate={isInvalid ? { x: [0, -5, 5, -5, 5, 0] } : {}}
        transition={{ duration: 0.4 }}
      >
        {isEditing ? (
          // TODO: handle different inner types
          <motion.div
            layout
            layoutId={uniqueId}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.8 }}
            transition={{ type: "spring", bounce: 0.15, duration: 0.15 }}
          >
            <Textarea
              value={value}
              onChange={handleInputChange}
              onKeyDown={onKeyDown}
              onBlur={() => setIsEditing(false)}
              placeholder={placeholder}
              className={cn(
                "flex-1 border-0 !bg-transparent p-0 text-xs shadow-none focus-visible:ring-0",
                isInvalid && "text-red-500"
              )}
              disabled={disabled}
              autosizeFrom={30}
              autosizeTo={150}
              minRows={1}
              maxRows={10}
              ref={inputRef}
            />
          </motion.div>
        ) : (
          <motion.div
            layout
            layoutId={uniqueId}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.8 }}
            transition={{ type: "spring", bounce: 0.15, duration: 0.15 }}
          >
            <Button
              variant="outline"
              size="sm"
              className="h-fit w-fit !p-0.5 text-xs"
              onClick={() => {
                setIsEditing(true);
                setTimeout(() => {
                  inputRef.current?.focus();
                }, 0);
              }}
              disabled={disabled}
            >
              <Plus />
            </Button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
