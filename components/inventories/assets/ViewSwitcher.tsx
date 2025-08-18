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

  console.log(views);

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
