import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useHypershelf } from "@/stores";
import { Ellipsis, Eye, EyeOff } from "lucide-react";

export function HeaderMenu() {
  const hiding = useHypershelf(state => state.hiding);
  const toggleHiding = useHypershelf(state => state.toggleHiding);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="!size-auto !p-1">
          <Ellipsis className="size-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent side="bottom" className="z-[9999]">
        <div className="flex flex-col">
          <Button variant="ghost" onClick={toggleHiding}>
            {hiding ? (
              <>
                <Eye />
                Показать скрытые поля
              </>
            ) : (
              <>
                <EyeOff />
                Не показывать скрытые поля
              </>
            )}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
