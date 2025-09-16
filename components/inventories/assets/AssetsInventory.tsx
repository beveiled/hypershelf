"use client";

import { useHeaderContent } from "@/components/util/HeaderContext";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ExtendedAssetType } from "@/convex/assets";
import { ExtendedViewType, FieldType } from "@/convex/schema";
import { useHypershelf } from "@/stores";
import { useAssetLock } from "../useLock";
import { HeaderMenu } from "./HeaderMenu";
import { TableSkeleton } from "./TableSkeleton";
import { ViewSwitcher } from "./ViewSwitcher";
import { TableView } from "./table-view";
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

export function AssetsInventory() {
  const { viewer: unstableViewer } = useQuery(api.users.me) ?? {};
  const { assets: unstableAssets } = useQuery(api.assets.get) ?? {};
  const { fields: unstableFields } = useQuery(api.fields.get) ?? {};
  const { users: unstableUsers } = useQuery(api.users.get) ?? {};
  const { views: unstableViews } = useQuery(api.views.get, {}) ?? {};

  const locker = useAssetLock(30000, 30);

  const setAssets = useHypershelf(state => state.setAssets);
  const setFields = useHypershelf(state => state.setFields);
  const setViewer = useHypershelf(state => state.setViewer);
  const setUsers = useHypershelf(state => state.setUsers);
  const setViews = useHypershelf(state => state.setViews);
  const setLocker = useHypershelf(state => state.setLocker);
  const setActiveViewId = useHypershelf(state => state.setActiveViewId);
  const init = useHypershelf(state => state.init);

  const activeViewId = useHypershelf(state => state.activeViewId);
  const loadingAssets = useHypershelf(state => state.loadingAssets);
  const viewsReady = useHypershelf(
    state => Object.keys(state.views).length > 0,
  );

  useEffect(() => {
    if (unstableAssets) {
      const newAssets: Record<Id<"assets">, ExtendedAssetType> = {};
      unstableAssets.forEach(asset => (newAssets[asset.asset._id] = asset));
      setAssets(newAssets);
    }
  }, [unstableAssets, setAssets]);

  useEffect(() => {
    if (unstableFields) {
      const newFields: Record<Id<"fields">, FieldType> = {};
      unstableFields.forEach(
        field => (newFields[field.field._id] = field.field),
      );
      setFields(newFields);
    }
  }, [unstableFields, setFields]);

  useEffect(() => {
    if (unstableUsers) {
      const newUsers: Record<Id<"users">, string> = {};
      unstableUsers.forEach(user => (newUsers[user.id] = user.email!));
      setUsers(newUsers);
    }
  }, [unstableUsers, setUsers]);

  useEffect(() => {
    if (unstableViewer) setViewer(unstableViewer);
  }, [unstableViewer, setViewer]);

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
      setLocker({ release: locker.releaseLock, acquire: locker.acquireLock }),
    [locker, setLocker],
  );

  useEffect(() => init(), [init]);

  const { setContent: setHeaderContent } = useHeaderContent();

  useEffect(() => {
    setHeaderContent(<Header />);
    return () => setHeaderContent(null);
  }, [setHeaderContent]);

  if (loadingAssets) {
    return <TableSkeleton />;
  }

  return <TableView />;
}
