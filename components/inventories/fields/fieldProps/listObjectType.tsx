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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { DynamicIcon, IconName } from "lucide-react/dynamic";
import { useCallback } from "react";
import { fieldTypes } from "../fieldTypes";
import { FieldPropArgs, FieldPropConfig } from "./_abstractProp";

function ListObjectTypeProp({
  prop,
  value,
  label,
  lockField,
  isLockedBySomeoneElse,
  change
}: FieldPropArgs) {
  const handleChange = useCallback(
    (v: string) => {
      change(prop, v);
    },
    [change, prop]
  );

  return (
    <div className="flex flex-col gap-1">
      <Label className="block text-xs font-medium">{label}</Label>
      <Select
        value={value?.toString() || ""}
        onValueChange={handleChange}
        disabled={isLockedBySomeoneElse}
      >
        <SelectTrigger className="w-full" onClick={lockField}>
          <SelectValue placeholder="Select type" />
        </SelectTrigger>
        <SelectContent>
          {fieldTypes
            .filter(e =>
              ["number", "string", "user", "email", "url"].includes(e.key)
            )
            .map(t => (
              <SelectItem key={t.key} value={t.key}>
                <div className="flex items-center gap-1.5">
                  <DynamicIcon name={t.icon as IconName} />
                  {t.label}
                </div>
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
    </div>
  );
}

const config: FieldPropConfig = {
  prop: "listObjectType",
  label: "Тип элементов",
  component: ListObjectTypeProp
};
export default config;
