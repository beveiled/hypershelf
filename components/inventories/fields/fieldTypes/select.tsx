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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectValue
} from "@/components/ui/select";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { useHypershelf } from "@/stores/assets";
import * as SelectPrimitive from "@radix-ui/react-select";
import { useMutation } from "convex/react";
import { ChevronDownIcon, Loader2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { FieldPropConfig } from "./_abstractType";

function InlineSelect({
  assetId,
  fieldId,
  readonly = false
}: {
  assetId: Id<"assets">;
  fieldId: Id<"fields">;
  readonly?: boolean;
}) {
  const updateAsset = useMutation(api.assets.update);
  const [updating, setUpdating] = useState(false);
  const [open, setOpen] = useState(false);

  const value = useHypershelf(state =>
    String(state.assets?.[assetId]?.asset?.metadata?.[fieldId])
  );
  const options = useHypershelf(
    state => state.fields?.[fieldId]?.extra?.options || []
  );
  const lockedBy = useHypershelf(
    state => state.lockedFields[assetId]?.[fieldId]
  );
  const lazyError = useHypershelf(
    state => state.assetErrors?.[assetId]?.[fieldId]
  );
  const disabled = useMemo(() => !!lockedBy, [lockedBy]);

  const onValueChange = useCallback(
    (value: string) => {
      setUpdating(true);
      setTimeout(() => {
        updateAsset({
          assetId,
          fieldId,
          value
        }).finally(() => setUpdating(false));
      }, 0);
    },
    [assetId, fieldId, updateAsset]
  );

  const onOpenChange = useCallback(
    (o: boolean) => {
      setOpen(o);
      const locker = useHypershelf.getState().locker;
      if (!o) {
        locker.release(assetId, fieldId);
      } else {
        locker.acquire(assetId, fieldId);
      }
    },
    [assetId, fieldId]
  );

  if (readonly) {
    return (
      <div
        className={cn(
          "select-none",
          !value && "text-muted-foreground/50 italic"
        )}
      >
        {value || "пусто"}
      </div>
    );
  }

  return (
    <div className="relative">
      {lockedBy && (
        <span className="text-brand absolute top-0 -mt-0.5 -translate-y-full text-[10px] whitespace-pre">
          {lockedBy}
        </span>
      )}
      {/* // TODO: Fix phantom re-renders (hook 22) */}
      <Select
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        open={open}
        onOpenChange={onOpenChange}
      >
        <SelectPrimitive.Trigger asChild>
          <Button
            size="sm"
            variant="ghost"
            className={cn(
              "h-auto w-full py-1",
              lockedBy && "ring-brand ring-2",
              lazyError &&
                !open &&
                "rounded-br-none rounded-bl-none !border-b-2 border-red-500"
            )}
            disabled={!!lockedBy || updating}
          >
            {value && options.includes(String(value)) ? (
              <SelectValue placeholder="Выбери опцию" />
            ) : (
              value
            )}
            {updating ? (
              <Loader2 className="size-4 animate-spin opacity-30" />
            ) : (
              <ChevronDownIcon className="size-4 opacity-30" />
            )}
          </Button>
        </SelectPrimitive.Trigger>
        <SelectContent>
          {options.map(option => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

const config: FieldPropConfig = {
  key: "select",
  label: "Выбор",
  icon: "list-todo",
  fieldProps: ["options"],
  component: InlineSelect
};

export default config;
