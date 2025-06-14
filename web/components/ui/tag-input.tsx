import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import React, { KeyboardEvent, useState } from "react";

interface TagInputProps {
  tags: string[];
  setTags: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
  draggable?: boolean;
  validateTag?: (tag: string) => boolean;
}

const SortableTag: React.FC<{ tag: string; onRemove: () => void }> = ({
  tag,
  onRemove
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: tag });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  return (
    <Badge
      ref={setNodeRef}
      style={style}
      variant="secondary"
      {...attributes}
      className="flex items-center gap-1 select-none"
    >
      <span {...listeners} className="cursor-move">
        {tag}
      </span>

      <Button
        type="button"
        size="icon"
        variant="secondary"
        onPointerDown={e => e.stopPropagation()}
        onClick={onRemove}
        className="h-4 w-4 p-0"
      >
        <X size={12} />
      </Button>
    </Badge>
  );
};

const StaticTag: React.FC<{ tag: string; onRemove: () => void }> = ({
  tag,
  onRemove
}) => (
  <Badge variant="secondary" className="flex items-center gap-1 select-none">
    <span className="mr-0.5">{tag}</span>
    <Button
      type="button"
      size="icon"
      variant="ghost"
      onClick={onRemove}
      className="h-4 w-4 p-0"
    >
      <X size={12} />
    </Button>
  </Badge>
);

export function TagInput({
  tags,
  setTags,
  placeholder = "Add items…",
  className,
  draggable = true,
  validateTag = () => true
}: TagInputProps) {
  const [value, setValue] = useState("");
  const [isInvalid, setIsInvalid] = useState(false);
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

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Enter" || e.key === ",") && value.trim()) {
      e.preventDefault();
      const success = addTag(value);
      if (success) {
        setValue("");
      }
    } else if (e.key === "Backspace" && !value && tags.length) {
      e.preventDefault();
      setTags(tags.slice(0, -1));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        "focus-within:ring-ring flex flex-wrap items-center gap-1 rounded-md border p-2 focus-within:ring-2",
        className
      )}
    >
      {draggable ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <SortableContext items={tags} strategy={rectSortingStrategy}>
            {tags.map(t => (
              <Tag
                key={t}
                tag={t}
                onRemove={() => setTags(tags.filter(x => x !== t))}
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
          />
        ))
      )}
      <motion.div
        className="min-w-[6rem] flex-1"
        animate={isInvalid ? { x: [0, -5, 5, -5, 5, 0] } : {}}
        transition={{ duration: 0.4 }}
      >
        <Input
          value={value}
          onChange={handleInputChange}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className={cn(
            "min-w-[6rem] flex-1 border-0 !bg-transparent p-0 text-xs shadow-none focus-visible:ring-0",
            isInvalid && "text-red-500"
          )}
        />
      </motion.div>
    </div>
  );
}
