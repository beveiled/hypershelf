import { Ellipsis } from "lucide-react";

import { Button } from "@hypershelf/ui/primitives/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@hypershelf/ui/primitives/popover";

import { Export } from "./Export";
import { ToggleHiding } from "./ToggleHiding";
import { Wayback } from "./Wayback";

export function ExtraActions() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="!p-1 !size-auto">
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
