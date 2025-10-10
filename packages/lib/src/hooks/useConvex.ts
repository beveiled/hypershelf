import { useEffect } from "react";
import { useQuery } from "convex/react";

import type { Id } from "@hypershelf/convex/_generated/dataModel";
import type {
  ExtendedAssetType,
  ExtendedFieldType,
  ExtendedViewType,
} from "@hypershelf/convex/schema";
import { api } from "@hypershelf/convex/_generated/api";
import { useHypershelf } from "@hypershelf/lib/stores";

export const useConvex = () => {
  const { viewer: unstableViewer } = useQuery(api.users.me) ?? {};
  const { fields: unstableFields } = useQuery(api.fields.get, {}) ?? {};
  const { assets: unstableAssets } = useQuery(api.assets.get, {}) ?? {};
  const { users: unstableUsers } = useQuery(api.users.get) ?? {};
  const { views: unstableViews } = useQuery(api.views.get, {}) ?? {};

  const setViewer = useHypershelf((state) => state.setViewer);
  const setFields = useHypershelf((state) => state.setFields);
  const setAssets = useHypershelf((state) => state.setAssets);
  const setUsers = useHypershelf((state) => state.setUsers);
  const setViews = useHypershelf((state) => state.setViews);

  useEffect(() => {
    if (unstableViewer) setViewer(unstableViewer);
  }, [unstableViewer, setViewer]);

  useEffect(() => {
    if (unstableFields) {
      const newFields: Record<Id<"fields">, ExtendedFieldType> = {};
      unstableFields.forEach((field) => (newFields[field.field._id] = field));
      setFields(newFields);
    }
  }, [unstableFields, setFields]);

  useEffect(() => {
    if (unstableAssets) {
      const newAssets: Record<Id<"assets">, ExtendedAssetType> = {};
      unstableAssets.forEach((asset) => (newAssets[asset.asset._id] = asset));
      setAssets(newAssets);
    }
  }, [unstableAssets, setAssets]);

  useEffect(() => {
    if (unstableUsers) {
      const newUsers: Record<Id<"users">, string> = {};
      unstableUsers.forEach(
        (user) => (newUsers[user.id] = user.email ?? "Незнакомец"),
      );
      setUsers(newUsers);
    }
  }, [unstableUsers, setUsers]);

  useEffect(() => {
    if (unstableViews) {
      const newViews: Record<Id<"views">, ExtendedViewType> = {};
      unstableViews.forEach((view) => (newViews[view._id] = view));
      setViews(newViews);
    }
  }, [unstableViews, setViews]);
};
