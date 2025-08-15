import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { FunctionReturnType } from "convex/server";
import { ChevronDown, Link } from "lucide-react";
import { useState } from "react";

export function ViewSwitcher({
  views,
  activeViewId,
  setActiveViewId
}: {
  views: FunctionReturnType<typeof api.views.get>["views"];
  activeViewId: Id<"views"> | null;
  setActiveViewId: (id: Id<"views">) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="!h-auto py-0 text-xs !ring-0 hover:!bg-transparent"
        >
          {views?.find(v => v._id === activeViewId)?.name || "Select View"}
          <ChevronDown />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <div className="flex flex-col gap-1">
          {views?.map(view => (
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
