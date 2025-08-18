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
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useHypershelf } from "@/stores/assets";
import { useMutation } from "convex/react";
import { CircleCheck, CirclePlus, Loader2 } from "lucide-react";
import { useState } from "react";
import { FieldPropConfig } from "./_abstractType";

function InlineBoolean({
  assetId,
  fieldId,
  readonly = false
}: {
  assetId: Id<"assets">;
  fieldId: Id<"fields">;
  readonly?: boolean;
}) {
  const updateAsset = useMutation(api.assets.update);
  const [updating, setUpdating] = useState(false);
  const value = useHypershelf(
    state => state.assets?.[assetId]?.asset?.metadata?.[fieldId]
  );

  if (readonly) {
    return value ? (
      <CircleCheck className="size-5 text-green-500" />
    ) : (
      <CirclePlus className="size-5 rotate-45 text-red-500" />
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-7 !bg-transparent"
      disabled={updating}
      onClick={() => {
        setUpdating(true);
        setTimeout(() => {
          updateAsset({
            assetId,
            fieldId,
            value: !value
          }).finally(() => setUpdating(false));
        }, 0);
      }}
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

const config: FieldPropConfig = {
  key: "boolean",
  label: "Да/Нет",
  icon: "square-check",
  fieldProps: [],
  component: InlineBoolean
};

export default config;
