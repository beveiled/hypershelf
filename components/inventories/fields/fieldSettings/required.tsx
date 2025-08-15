import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { AbstractProp } from "./_abstractProp";

const key = "required";

class RequiredProp extends AbstractProp {
  handleChange = (state: boolean) => {
    this.props.change(key, state);
  };

  render() {
    const { value, lockField, isLockedBySomeoneElse } = this.props;
    return (
      <div className="flex items-center gap-2">
        <Checkbox
          checked={!!value}
          onCheckedChange={checked => {
            lockField?.();
            this.handleChange(!!checked);
          }}
          disabled={isLockedBySomeoneElse}
        />
        <Label className="text-xs font-medium">Required</Label>
      </div>
    );
  }
}

const config = { key, component: RequiredProp, full: true };
export default config;
