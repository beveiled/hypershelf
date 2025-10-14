import { ExtraActions } from "./providers/extra";
import { NewAsset } from "./providers/NewAsset";
import { QueryBuilder } from "./providers/QueryBuilder";
import { Search } from "./providers/Search";
import { ViewSwitcher } from "./providers/ViewSwitcher";

export function Header() {
  return (
    <div className="flex justify-between">
      <NewAsset />
      <Search />
      <QueryBuilder />
      <ExtraActions />
      <ViewSwitcher />
    </div>
  );
}
