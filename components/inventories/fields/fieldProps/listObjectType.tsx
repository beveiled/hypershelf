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
                <DynamicIcon name={t.icon as IconName} />
                {t.label}
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
