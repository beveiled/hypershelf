import type { IconName } from "lucide-react/dynamic";

import type { Id } from "@hypershelf/convex/_generated/dataModel";

interface SharedProps {
  key: string;
  label: string;
  icon: IconName;
  fieldProps: string[];
  component: (args: {
    assetId: Id<"assets">;
    fieldId: Id<"fields">;
    readonly?: boolean;
  }) => React.ReactNode;
}

export type FieldPropConfig =
  | ({
      icon: IconName;
      magic?: false;
    } & SharedProps)
  | ({
      magic: true;
    } & SharedProps);
