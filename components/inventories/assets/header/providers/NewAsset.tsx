import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { PlusCircle } from "lucide-react";

export function NewAsset() {
  const createAsset = useMutation(api.assets.create);

  const onClick = async () => {
    const newAsset = await createAsset();
    if (newAsset) {
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
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className="!size-auto !p-1"
      onClick={onClick}
    >
      <PlusCircle className="size-4 opacity-50" />
    </Button>
  );
}
