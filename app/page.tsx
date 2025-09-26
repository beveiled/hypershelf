"use client";

import { HeaderMenu } from "@/components/inventories/assets/HeaderMenu";
import { ViewSwitcher } from "@/components/inventories/assets/ViewSwitcher";
import { TableView } from "@/components/inventories/assets/table-view";
import { TableSkeleton } from "@/components/inventories/assets/table-view/TableSkeleton";
import { useAssetLock } from "@/components/inventories/useLock";
import { useHeaderContent } from "@/components/util/HeaderContext";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ExtendedViewType } from "@/convex/schema";
import { useHypershelf } from "@/stores";
import { useQuery } from "convex/react";
import { useEffect } from "react";

function Header() {
  return (
    <div className="flex justify-between">
      <HeaderMenu />
      <ViewSwitcher />
    </div>
  );
}

export default function AssetsInventory() {
  const { users: unstableUsers } = useQuery(api.users.get) ?? {};
  const { views: unstableViews } = useQuery(api.views.get, {}) ?? {};

  const locker = useAssetLock(30000, 30);

  const setUsers = useHypershelf(state => state.setUsers);
  const setViews = useHypershelf(state => state.setViews);
  const setAssetsLocker = useHypershelf(state => state.setAssetsLocker);
  const setActiveViewId = useHypershelf(state => state.setActiveViewId);
  const init = useHypershelf(state => state.init);

  const activeViewId = useHypershelf(state => state.activeViewId);
  const loadingAssets = useHypershelf(state => state.loadingAssets);
  const viewsReady = useHypershelf(
    state => Object.keys(state.views).length > 0,
  );

  useEffect(() => {
    if (unstableUsers) {
      const newUsers: Record<Id<"users">, string> = {};
      unstableUsers.forEach(user => (newUsers[user.id] = user.email!));
      setUsers(newUsers);
    }
  }, [unstableUsers, setUsers]);

  useEffect(() => {
    if (unstableViews) {
      const newViews: Record<Id<"views">, ExtendedViewType> = {};
      unstableViews.forEach(view => (newViews[view._id] = view));
      setViews(newViews);
    }
  }, [unstableViews, setViews]);

  useEffect(() => {
    if (activeViewId || !viewsReady) return;
    setActiveViewId(localStorage.getItem("activeViewId") as Id<"views"> | null);
  }, [activeViewId, setActiveViewId, viewsReady]);

  useEffect(
    () =>
      setAssetsLocker({
        release: locker.releaseLock,
        acquire: locker.acquireLock,
      }),
    [locker, setAssetsLocker],
  );

  useEffect(() => init(), [init]);

  const { setContent: setHeaderContent } = useHeaderContent();

  // TODO: query builder
  // TODO: add asset ui
  // TODO: remove asset ui

  useEffect(() => {
    setHeaderContent(<Header />);
    return () => setHeaderContent(null);
  }, [setHeaderContent]);

  if (loadingAssets) {
    return (
      <div className="flex flex-col gap-4">
        <TableSkeleton />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <TableView />
    </div>
  );
}
