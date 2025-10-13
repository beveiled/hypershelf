import { useMutation } from "convex/react";
import { PlusCircle } from "lucide-react";

import { api } from "@hypershelf/convex/_generated/api";
import { useHypershelf } from "@hypershelf/lib/stores";
import { Button } from "@hypershelf/ui/primitives/button";

export function NewAsset() {
  const createAsset = useMutation(api.assets.create);
  const markCreatedAsset = useHypershelf((state) => state.markCreatedAsset);

  const onClick = async () => {
    const newAsset = await createAsset();
    if (!newAsset.assetId) return;

    markCreatedAsset(newAsset.assetId);
    let retries = 30;
    const interval = setInterval(() => {
      const el = document.getElementById(`asset-row-${newAsset.assetId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
        clearInterval(interval);
      }
      retries -= 1;
      if (retries <= 0) {
        clearInterval(interval);
      }
    }, 100);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className="!p-1 !size-auto"
      onClick={onClick}
    >
      <PlusCircle className="size-4 opacity-50" />
    </Button>
  );
}
