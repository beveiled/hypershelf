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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useHypershelf } from "@/stores/assets";
import { ChevronDown, Link } from "lucide-react";
import { useState } from "react";

export function ViewSwitcher() {
  const views = useHypershelf(state => state.views);
  const activeViewId = useHypershelf(state => state.activeViewId);
  const setActiveViewId = useHypershelf(state => state.setActiveViewId);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="!h-auto cursor-not-allowed py-0 text-xs !ring-0 hover:!bg-transparent"
          disabled={true}
        >
          {(activeViewId && views?.[activeViewId]?.name) || "Выбери вид"}
          <ChevronDown />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <div className="flex flex-col gap-1">
          {Object.values(views).map(view => (
            <Button
              key={view._id}
              variant="ghost"
              className={cn(
                "w-48 text-left",
                activeViewId === view._id
                  ? "pointer-events-none bg-white/10"
                  : "hover:bg-white/5"
              )}
              onClick={() => {
                setActiveViewId(view._id);
                localStorage.setItem("activeViewId", view._id);
                setIsOpen(false);
              }}
            >
              {view.name}
              {view.global && !view.builtin && <Link />}
            </Button>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
