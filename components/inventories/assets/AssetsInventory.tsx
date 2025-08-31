/*
https://github.com/beveiled/hypershelf
Copyright (C) 2025  Daniil Gazizullin

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/
"use client";

import { useHeaderContent } from "@/components/util/HeaderContext";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ExtendedAssetType } from "@/convex/assets";
import { ExtendedViewType, FieldType } from "@/convex/schema";
import { useHypershelf } from "@/stores/assets";
import { useQuery } from "convex/react";
import { useEffect } from "react";
import { useAssetLock } from "../useLock";
import { HeaderMenu } from "./HeaderMenu";
import { TableView } from "./table-view";
import { TableSkeleton } from "./TableSkeleton";
import { ViewSwitcher } from "./ViewSwitcher";

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
  const setActiveViewId = useHypershelf(state => state.setActiveViewId);
  const init = useHypershelf(state => state.init);

  const activeViewId = useHypershelf(state => state.activeViewId);
  const loadingAssets = useHypershelf(state => state.loadingAssets);
  const viewsReady = useHypershelf(
    state => Object.keys(state.views).length > 0
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
        field => (newFields[field.field._id] = field.field)
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
      useHypershelf.setState({ views: newViews });
    }
  }, [unstableViews]);

  useEffect(() => {
    if (activeViewId || !viewsReady) return;
    setActiveViewId(localStorage.getItem("activeViewId") as Id<"views"> | null);
  }, [activeViewId, setActiveViewId, viewsReady]);

  useEffect(
    () =>
      useHypershelf.setState({
        locker: { release: locker.releaseLock, acquire: locker.acquireLock }
      }),
    [locker]
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
