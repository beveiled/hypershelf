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
