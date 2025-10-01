import { NewAsset } from "./providers/NewAsset";
import { QueryBuilder } from "./providers/QueryBuilder";
import { ViewSwitcher } from "./providers/ViewSwitcher";
import { ExtraActions } from "./providers/extra";

export function Header() {
  return (
    <div className="flex justify-between">
      <NewAsset />
      <QueryBuilder />
      <ExtraActions />
      <ViewSwitcher />
    </div>
  );
}
