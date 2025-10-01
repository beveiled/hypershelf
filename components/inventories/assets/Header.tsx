import { HeaderMenu } from "./HeaderMenu";
import { NewAsset } from "./NewAsset";
import { QueryBuilder } from "./QueryBuilder";
import { ViewSwitcher } from "./ViewSwitcher";

export function Header() {
  return (
    <div className="flex justify-between">
      <NewAsset />
      <QueryBuilder />
      <HeaderMenu />
      <ViewSwitcher />
    </div>
  );
}
