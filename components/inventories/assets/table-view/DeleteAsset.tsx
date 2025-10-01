import { Button } from "@/components/ui/button";
import { ButtonWithKbd } from "@/components/ui/kbd-button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TableCell } from "@/components/ui/table";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { PopoverClose } from "@radix-ui/react-popover";
import { useMutation } from "convex/react";
import { LoaderCircle, Trash } from "lucide-react";
import { useState } from "react";

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
        <PopoverContent className="w-fit z-[9999]">
          <div className="flex flex-col gap-2">
            <p className="text-sm">Уверен, что хочешь удалить этот хост?</p>
            <div className="flex gap-2">
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
                  <LoaderCircle className="text-red-300/70 animate-spin" />
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
