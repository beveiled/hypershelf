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
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { useHypershelf } from "@/stores/assets";
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
      <PopoverContent side="bottom">
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
