import { useState } from "react";
import { PopoverClose } from "@radix-ui/react-popover";
import { useMutation } from "convex/react";
import { LoaderCircle, Trash } from "lucide-react";

import type { Id } from "@hypershelf/convex/_generated/dataModel";
import { api } from "@hypershelf/convex/_generated/api";
import { Button } from "@hypershelf/ui/primitives/button";
import { ButtonWithKbd } from "@hypershelf/ui/primitives/kbd-button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@hypershelf/ui/primitives/popover";
import { TableCell } from "@hypershelf/ui/primitives/table";

export function DeleteAsset({ assetId }: { assetId: Id<"assets"> }) {
  const deleteAsset = useMutation(api.assets.remove);
  const [isDeleting, setIsDeleting] = useState(false);

  return (
    <TableCell>
      <Popover>
        <PopoverTrigger asChild>
          <Button size="sm" variant="ghost" className="group">
            <Trash className="size-4 group-hover:text-red-500 text-muted-foreground transition-colors duration-150" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="z-[9999] w-fit">
          <div className="gap-2 flex flex-col">
            <p className="text-sm">Уверен, что хочешь удалить этот хост?</p>
            <div className="gap-2 flex">
              <PopoverClose asChild>
                <ButtonWithKbd
                  size="sm"
                  variant="outline"
                  keys={["Esc"]}
                  className="flex-auto"
                >
                  Отмена
                </ButtonWithKbd>
              </PopoverClose>
              <Button
                size="sm"
                variant="destructive"
                onClick={async () => {
                  setIsDeleting(true);
                  try {
                    await deleteAsset({ id: assetId });
                  } finally {
                    setIsDeleting(false);
                  }
                }}
                disabled={isDeleting}
              >
                {isDeleting && (
                  <LoaderCircle className="animate-spin text-red-300/70" />
                )}
                Удалить
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </TableCell>
  );
}
