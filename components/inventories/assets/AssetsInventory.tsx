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

import { MarkdownEditorPopup } from "@/components/markdown-editor/markdown-popup";
import { useHeaderContent } from "@/components/util/HeaderContext";
import { useLog } from "@/components/util/Log";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ExtendedAssetType } from "@/convex/assets";
import { FieldType } from "@/convex/schema";
import { ViewType } from "@/convex/views";
import { useHypershelf } from "@/stores/assets";
import { useQuery } from "convex/react";
import { useEffect, useMemo } from "react";
import { useAssetLock } from "../useLock";
import { TableSkeleton } from "./TableSkeleton";
import { TableView } from "./TableView";
import { ViewSwitcher } from "./ViewSwitcher";

export function AssetsInventory() {
  const ingestLogs = useLog();
  const { viewer: unstableViewer } = useQuery(api.users.me) ?? {};
  const { assets: unstableAssets } = useQuery(api.assets.get) ?? {};
  const { fields: unstableFields } = useQuery(api.fields.get) ?? {};
  const { users: unstableUsers } = useQuery(api.users.get) ?? {};
  const { views: unstableViews } = useQuery(api.views.get, {}) ?? {};

  const views = useHypershelf(state => state.views);
  const assets = useHypershelf(state => state.assets);
  const setAssets = useHypershelf(state => state.setAssets);
  const setFields = useHypershelf(state => state.setFields);
  const setViewer = useHypershelf(state => state.setViewer);
  const activeViewId = useHypershelf(state => state.activeViewId);
  const setActiveViewId = useHypershelf(state => state.setActiveViewId);
  const setSorting = useHypershelf(state => state.setSorting);

  useEffect(() => {
    if (unstableAssets) {
      const newAssets: Record<Id<"assets">, ExtendedAssetType> = {};
      unstableAssets.forEach(asset => {
        newAssets[asset.asset._id] = asset;
      });
      setAssets(newAssets);
    }
  }, [unstableAssets, setAssets]);

  useEffect(() => {
    if (unstableFields) {
      const newFields: Record<Id<"fields">, FieldType> = {};
      unstableFields.forEach(field => {
        newFields[field.field._id] = field.field;
      });
      setFields(newFields);
    }
  }, [unstableFields, setFields]);

  useEffect(() => {
    if (unstableViewer) {
      console.log(unstableViewer);
      setViewer(unstableViewer);
    }
  }, [unstableViewer, setViewer]);

  useEffect(() => {
    if (unstableUsers) {
      useHypershelf.setState({ users: unstableUsers });
    }
  }, [unstableUsers]);

  useEffect(() => {
    if (unstableViews) {
      const newViews: Record<Id<"views">, ViewType> = {};
      unstableViews.forEach(view => {
        newViews[view._id] = view;
      });
      useHypershelf.setState({ views: newViews });
    }
  }, [unstableViews]);

  const activeView = useMemo(() => {
    if (!views || !activeViewId) return null;
    return views?.[activeViewId] || null;
  }, [views, activeViewId]);

  useEffect(() => {
    if (!activeView || !activeView.sortBy) return;
    setSorting(activeView.sortBy);
  }, [activeView, setSorting]);

  useEffect(() => {
    if (activeViewId || !views) return;
    const preferredView = localStorage.getItem("activeViewId");
    let view;
    if (preferredView) {
      view = views?.[preferredView as Id<"views">];
    }
    view ??= views?.["builtin:all" as Id<"views">];
    if (!view) return;

    setActiveViewId(view._id);
  }, [activeViewId, views, setActiveViewId]);

  const { acquireLock, releaseLock } = useAssetLock(ingestLogs, 30000, 30);

  useEffect(() => {
    useHypershelf.setState({
      locker: {
        acquire: acquireLock,
        release: releaseLock
      }
    });
  }, [acquireLock, releaseLock]);

  const { setContent: setHeaderContent } = useHeaderContent();

  useEffect(() => {
    setHeaderContent(<ViewSwitcher />);
    return () => setHeaderContent(null);
  }, [setHeaderContent]);

  if (assets === undefined) {
    return <TableSkeleton />;
  }

  return (
    <>
      <TableView />
      <MarkdownEditorPopup />
    </>
  );
}
