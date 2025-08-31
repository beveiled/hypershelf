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
import { Input } from "@/components/ui/input";
import { ButtonWithKbd } from "@/components/ui/kbd-button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { api } from "@/convex/_generated/api";
import { ExtendedViewType } from "@/convex/schema";
import { cn } from "@/lib/utils";
import { useHypershelf, useIsViewDirty } from "@/stores/assets";
import { useMutation } from "convex/react";
import {
  ChevronDown,
  Link,
  Lock,
  Plus,
  Save,
  SaveOff,
  Undo2,
  X
} from "lucide-react";
import { useState } from "react";

export function ViewSwitcher() {
  const updateView = useMutation(api.views.update);
  const createView = useMutation(api.views.create);

  const views = useHypershelf(state => state.views);
  const activeView: ExtendedViewType | null = useHypershelf(state =>
    state.activeViewId ? state.views?.[state.activeViewId] : null
  );
  const activeViewId = useHypershelf(state => state.activeViewId);
  const setActiveViewId = useHypershelf(state => state.setActiveViewId);
  const applyView = useHypershelf(state => state.applyView);

  const isDirty = useIsViewDirty();
  const [open, setOpen] = useState(false);
  const [creatingNewView, setCreatingNewView] = useState(false);
  const [newViewName, setNewViewName] = useState("");

  const saveView = async () => {
    if (!activeView || activeView.immutable) return;
    try {
      const { hiddenFields, sorting, fieldOrder } = useHypershelf.getState();
      await updateView({
        viewId: activeView._id,
        hiddenFields: hiddenFields,
        sorting: sorting,
        fieldOrder: fieldOrder
      });
      setOpen(false);
    } catch (e) {
      console.error("Failed to save view", e);
    }
  };

  const revertView = () => {
    if (!activeViewId) return;
    applyView(activeViewId);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="!h-auto gap-1 py-0 text-xs !ring-0 hover:!bg-transparent"
        >
          {activeView?.name || "Выбери вид"}
          <ChevronDown className="size-4 opacity-60" />
          {isDirty && (
            <SaveOff className="ml-1 size-3 animate-pulse text-yellow-300" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="z-[9999] flex w-fit flex-col gap-1 p-2"
        side="bottom"
      >
        {isDirty ? (
          <div className="flex flex-col gap-2 px-4 py-2">
            <div className="px-4 text-xs text-yellow-400">
              Есть несохраненные изменения вида
            </div>
            <div className="flex flex-col justify-center gap-1">
              <Button
                size="sm"
                variant="outline"
                disabled={activeView?.immutable}
                className={cn(activeView?.immutable && "cursor-not-allowed")}
                onClick={saveView}
              >
                <Save className="size-4" />
                Сохранить
              </Button>
              <Button size="sm" variant="outline" onClick={revertView}>
                <Undo2 className="size-4" />
                Откатить
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                <X className="size-4" />
                Закрыть
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex min-w-64 flex-col gap-1">
            {Object.values(views).map(view => {
              const isActive = activeViewId === view._id;
              return (
                <Button
                  key={view._id}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "w-full gap-2 text-left",
                    isActive
                      ? "pointer-events-none bg-white/10"
                      : "hover:bg-white/5"
                  )}
                  onClick={() => {
                    setActiveViewId(view._id);
                    localStorage.setItem("activeViewId", view._id);
                    setOpen(false);
                  }}
                >
                  {view.immutable && <Lock className="size-3 opacity-70" />}
                  <span className="truncate">{view.name}</span>
                  {view.global && !view.builtin && (
                    <Link className="size-3 opacity-70" />
                  )}
                </Button>
              );
            })}
            <Popover open={creatingNewView} onOpenChange={setCreatingNewView}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setCreatingNewView(true)}
                >
                  <Plus /> Создать новый
                </Button>
              </PopoverTrigger>
              <PopoverContent className="mt-4 w-80">
                <div className="flex flex-col gap-4">
                  <Input
                    placeholder="Название вида"
                    value={newViewName}
                    onChange={e => setNewViewName(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <ButtonWithKbd
                      disabled={!newViewName}
                      onClick={async () => {
                        const view = await createView({ name: newViewName });
                        setActiveViewId(view);
                        setNewViewName("");
                        setCreatingNewView(false);
                        setOpen(false);
                      }}
                      className="flex-auto"
                      keys={["Enter"]}
                      showKbd={!!newViewName}
                    >
                      <Plus className="size-4" />
                      Создать
                    </ButtonWithKbd>
                    <ButtonWithKbd
                      variant="outline"
                      onClick={() => {
                        setCreatingNewView(false);
                        setNewViewName("");
                      }}
                      keys={["Esc"]}
                    >
                      Отмена
                    </ButtonWithKbd>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
