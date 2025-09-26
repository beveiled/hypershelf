import { Id } from "@/convex/_generated/dataModel";
import { IconName } from "lucide-react/dynamic";

type SharedProps = {
  key: string;
  label: string;
  icon: IconName;
  fieldProps: string[];
  component: (args: {
    assetId: Id<"assets">;
    fieldId: Id<"fields">;
    readonly?: boolean;
  }) => React.ReactNode;
};

export type FieldPropConfig =
  | ({
      icon: IconName;
      magic?: false;
    } & SharedProps)
  | ({
      magic: true;
    } & SharedProps);
