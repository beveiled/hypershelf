import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Export } from "./Export";
import { ToggleHiding } from "./ToggleHiding";
import { Wayback } from "./Wayback";
import { Ellipsis } from "lucide-react";

export function ExtraActions() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="!size-auto !p-1">
          <Ellipsis className="size-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent side="bottom" className="z-[9999]">
        <div className="flex flex-col">
          <ToggleHiding />
          <Wayback />
          <Export />
        </div>
      </PopoverContent>
    </Popover>
  );
}
