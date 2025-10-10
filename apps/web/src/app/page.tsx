"use client";

import { useEffect } from "react";

import type { Id } from "@hypershelf/convex/_generated/dataModel";
import { useHypershelf } from "@hypershelf/lib/stores";

import { Header } from "~/components/inventories/assets/header";
import { TableView } from "~/components/inventories/assets/table-view";
import { TableSkeleton } from "~/components/inventories/assets/table-view/TableSkeleton";
import { useAssetLock } from "~/components/inventories/useLock";
import { useHeaderContent } from "~/components/util/HeaderContext";

export default function AssetsInventory() {
  const locker = useAssetLock(30000, 30);

  const setAssetsLocker = useHypershelf((state) => state.setAssetsLocker);
  const setActiveViewId = useHypershelf((state) => state.setActiveViewId);
  const init = useHypershelf((state) => state.init);

  const activeViewId = useHypershelf((state) => state.activeViewId);
  const loadingAssets = useHypershelf((state) => state.loadingAssets);
  const viewsReady = useHypershelf(
    (state) => Object.keys(state.views).length > 0,
  );

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

  useEffect(() => {
    setHeaderContent(<Header />);
    return () => setHeaderContent(null);
  }, [setHeaderContent]);

  if (loadingAssets) {
    return (
      <div className="gap-4 flex flex-col">
        <TableSkeleton />
      </div>
    );
  }

  return (
    <div className="gap-4 flex flex-col">
      <TableView />
    </div>
  );
}
