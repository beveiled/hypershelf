import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { DynamicIcon, IconName } from "lucide-react/dynamic";
import { FIELD_TYPES } from "../consts";
import { AbstractProp } from "./_abstractProp";

const key = "listObjectType";

class ListObjectTypeProp extends AbstractProp {
  handleChange = (e: string) => {
    this.props.change(key, e);
  };

  render() {
    const { value, lockField, isLockedBySomeoneElse } = this.props;
    return (
      <div className="flex flex-col gap-1">
        <Label className="block text-xs font-medium">Тип элементов</Label>
        <Select
          value={value?.toString() || ""}
          onValueChange={this.handleChange}
          disabled={isLockedBySomeoneElse}
        >
          <SelectTrigger className="w-full" onClick={lockField}>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            {FIELD_TYPES.filter(e =>
              ["number", "string", "user", "email", "url"].includes(e.value)
            ).map(t => (
              <SelectItem key={t.value} value={t.value}>
                <DynamicIcon name={t.icon as IconName} />
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }
}

const config = { key, component: ListObjectTypeProp };
export default config;
