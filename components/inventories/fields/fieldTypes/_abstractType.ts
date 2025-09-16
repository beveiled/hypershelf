import { Id } from "@/convex/_generated/dataModel";
import { IconName } from "lucide-react/dynamic";

export type FieldPropConfig = {
  key: string;
  label: string;
  icon: IconName;
  fieldProps: string[];
  component: ({
    assetId,
    fieldId,
  }: {
    assetId: Id<"assets">;
    fieldId: Id<"fields">;
  }) => React.ReactNode;
};
