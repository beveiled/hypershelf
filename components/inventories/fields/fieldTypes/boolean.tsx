import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useHypershelf } from "@/stores";
import { FieldPropConfig } from "./_abstractType";
import { useMutation } from "convex/react";
import { CircleCheck, CirclePlus, Loader2 } from "lucide-react";
import { useCallback, useState } from "react";

function InlineBoolean({
  assetId,
  fieldId,
  readonly = false,
}: {
  assetId: Id<"assets">;
  fieldId: Id<"fields">;
  readonly?: boolean;
}) {
  const updateAsset = useMutation(api.assets.update);
  const [updating, setUpdating] = useState(false);
  const value = useHypershelf(
    state => state.assets?.[assetId]?.asset?.metadata?.[fieldId],
  );
  const onClick = useCallback(() => {
    setUpdating(true);
    setTimeout(() => {
      updateAsset({
        assetId,
        fieldId,
        value: !value,
      }).finally(() => {
        setUpdating(false);
        const locker = useHypershelf.getState().assetsLocker;
        locker.release(assetId, fieldId);
      });
    }, 0);
  }, [assetId, fieldId, updateAsset, value]);

  if (readonly) {
    return value ? (
      <CircleCheck className="size-4 text-green-500" />
    ) : (
      <CirclePlus className="size-4 rotate-45 text-red-500" />
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-7 !bg-transparent"
      disabled={updating}
      onClick={onClick}
    >
      {updating ? (
        <Loader2 className="size-5 animate-spin" />
      ) : value ? (
        <CircleCheck className="size-5 text-green-500" />
      ) : (
        <CirclePlus className="size-5 rotate-45 text-red-500" />
      )}
    </Button>
  );
}

const config = {
  key: "boolean",
  label: "Да/Нет",
  icon: "square-check",
  fieldProps: [],
  component: InlineBoolean,
} as const satisfies FieldPropConfig;

export default config;
