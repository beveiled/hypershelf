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
import { Id } from "@/convex/_generated/dataModel";
import { ExtendedAssetType } from "@/convex/assets";
import { AssetType, FieldType, UserType } from "@/convex/schema";
import { validateFields } from "@/convex/utils";
import { ViewType } from "@/convex/views";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { devtools } from "zustand/middleware";
import { shallow } from "zustand/shallow";

function compareMetadata(a: AssetType["metadata"], b: AssetType["metadata"]) {
  if (Object.is(a, b)) return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (!Object.is(a[i], b[i])) return false;
    return true;
  }
  if (a && b && typeof a === "object" && typeof b === "object") {
    const ka = Object.keys(a);
    const kb = Object.keys(b);
    if (ka.length !== kb.length) return false;
    for (const k of ka)
      if (
        !Object.is(
          a[k as keyof AssetType["metadata"]],
          b[k as keyof AssetType["metadata"]]
        )
      )
        return false;
    return true;
  }
  return false;
}

function compareLocks(
  a: ExtendedAssetType["locks"] | undefined,
  b: ExtendedAssetType["locks"] | undefined
) {
  if (Object.is(a, b)) return true;
  if ((!a && b) || (a && !b)) return false;
  if (!a || !b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const lockA = a[i];
    const lockB = b[i];
    if (
      lockA.fieldId !== lockB.fieldId ||
      lockA.holder?.id !== lockB.holder?.id
    ) {
      return false;
    }
  }
  return true;
}

export function assetsEqual(a: ExtendedAssetType, b: ExtendedAssetType) {
  if (a.asset._id !== b.asset._id) return false;
  return (
    compareMetadata(a.asset.metadata ?? {}, b.asset.metadata ?? {}) &&
    compareLocks(a.locks, b.locks)
  );
}

const fieldsEqual = (a: FieldType, b: FieldType) => {
  const compare_keys = ["_id", "slug", "name", "type", "required"];
  for (const key of compare_keys) {
    if (!Object.is(a[key as keyof FieldType], b[key as keyof FieldType]))
      return false;
  }
  if (a.extra && b.extra) {
    const aExtraKeys = Object.keys(a.extra);
    const bExtraKeys = Object.keys(b.extra);
    if (aExtraKeys.length !== bExtraKeys.length) return false;
    if (aExtraKeys.some(key => !bExtraKeys.includes(key))) return false;
    if (bExtraKeys.some(key => !aExtraKeys.includes(key))) return false;
    for (const key of aExtraKeys) {
      if (
        !Object.is(
          a.extra[key as keyof FieldType["extra"]],
          b.extra[key as keyof FieldType["extra"]]
        )
      )
        return false;
    }
  } else if (a.extra || b.extra) {
    return false;
  }
  return true;
};

type LockedFields = Record<Id<"assets">, Record<Id<"fields">, string>>;
type AssetErrors = Record<Id<"assets">, Record<Id<"fields">, string>>;
type AssetsDict = Record<Id<"assets">, ExtendedAssetType>;
type FieldsDict = Record<Id<"fields">, FieldType>;
type SortingDict = Record<Id<"fields">, "asc" | "desc">;
type ViewsDict = Record<Id<"views">, ViewType>;

type State = {
  assetIds: Id<"assets">[];
  loadingAssets: boolean;
  assets: AssetsDict;
  assetErrors: AssetErrors;
  lockedFields: LockedFields;
  fieldIds: Id<"fields">[];
  fields: FieldsDict;
  viewer: Id<"users"> | null | undefined;
  users: { id: Id<"users">; email?: string }[];
  sorting: SortingDict;
  hiding: boolean;
  hiddenFields: Id<"fields">[];
  fieldOrder: Id<"fields">[];
  activeViewId: Id<"views"> | null;
  views: ViewsDict;
  locker: {
    acquire: (assetId: Id<"assets">, fieldId: Id<"fields">) => Promise<boolean>;
    release: (assetId: Id<"assets">, fieldId: Id<"fields">) => Promise<void>;
  };
};

type Actions = {
  setAssets: (assets: AssetsDict) => void;
  setFields: (fields: FieldsDict) => void;
  setViewer: (viewer: Id<"users"> | null | undefined) => void;
  setUsers: (users: UserType[]) => void;
  setSorting: (sorting: SortingDict) => void;
  toggleSorting: (fieldId: Id<"fields">) => void;
  toggleVisibility: (fieldId: Id<"fields">) => void;
  toggleHiding: () => void;
  setActiveViewId: (activeView: Id<"views"> | null) => void;
  setViews: (views: ViewType[]) => void;
  revalidateErrors: () => void;
  revalidateLocks: () => void;
};

const initialState: State = {
  assetIds: [],
  loadingAssets: true,
  assets: {},
  fieldIds: [],
  fields: {},
  views: {},
  assetErrors: {},
  lockedFields: {},
  locker: {
    acquire: async () => false,
    release: async () => {}
  },
  activeViewId: null,
  sorting: {},
  hiding: true,
  hiddenFields: [],
  fieldOrder: [],
  viewer: null,
  users: []
} as State;

export const useHypershelf = create<State & Actions>()(
  devtools(
    immer((set, get) => ({
      ...initialState,
      revalidateErrors: () =>
        set(state => {
          for (const [, asset] of Object.entries(state.assets)) {
            const errs = validateFields(
              Object.values(state.fields),
              asset.asset.metadata ?? {}
            );
            if (errs && Object.keys(errs).length > 0) {
              if (!state.assetErrors[asset.asset._id])
                state.assetErrors[asset.asset._id] = {};
              for (const [fieldId, error] of Object.entries(errs)) {
                if (
                  state.assetErrors[asset.asset._id][
                    fieldId as Id<"fields">
                  ] === error
                )
                  continue;
                state.assetErrors[asset.asset._id][fieldId as Id<"fields">] =
                  error;
              }
              for (const fieldId of Object.keys(
                state.assetErrors[asset.asset._id]
              )) {
                if (!errs[fieldId]) {
                  delete state.assetErrors[asset.asset._id][
                    fieldId as Id<"fields">
                  ];
                }
              }
            } else {
              delete state.assetErrors[asset.asset._id];
            }
          }
        }),
      revalidateLocks: () =>
        set(state => {
          if (!state.viewer) {
            console.warn("Refusing to revalidate locks without viewer");
            return;
          }
          for (const [, asset] of Object.entries(state.assets)) {
            if (!asset.locks) continue;
            if (!state.lockedFields[asset.asset._id]) {
              state.lockedFields[asset.asset._id] = {};
            }
            for (const lock of asset.locks) {
              if (
                state.lockedFields[asset.asset._id][lock.fieldId] !==
                  (lock.holder?.email || "Кто-то") &&
                lock.holder?.id !== state.viewer
              ) {
                state.lockedFields[asset.asset._id][lock.fieldId] =
                  lock.holder?.email || "Кто-то";
              }
            }
            for (const fieldId of Object.keys(
              state.lockedFields[asset.asset._id]
            )) {
              if (
                !asset.locks.some(lock => lock.fieldId === fieldId) &&
                state.lockedFields[asset.asset._id][fieldId as Id<"fields">]
              ) {
                delete state.lockedFields[asset.asset._id][
                  fieldId as Id<"fields">
                ];
              }
            }
          }
        }),
      setAssets: incoming => {
        set(state => {
          for (const [id, asset] of Object.entries(incoming) as [
            Id<"assets">,
            ExtendedAssetType
          ][]) {
            if (!!state.assets[id] && assetsEqual(state.assets[id], asset))
              continue;
            if (!state.assetIds.includes(id)) {
              state.assetIds.push(id);
            }

            if (!state.assets[id]) {
              state.assets[id] = asset;
            } else {
              if (!shallow(asset.locks, state.assets[id].locks)) {
                state.assets[id].locks = asset.locks;
              }
              if (asset.asset.metadata) {
                const prevKeys = Object.keys(
                  state.assets[id].asset.metadata || {}
                ) as (keyof AssetType["metadata"])[];
                const newKeys = Object.keys(
                  asset.asset.metadata || {}
                ) as (keyof AssetType["metadata"])[];
                for (const key of prevKeys) {
                  if (!newKeys.includes(key)) {
                    delete state.assets[id].asset.metadata?.[key];
                  }
                }
                if (!state.assets[id].asset.metadata)
                  state.assets[id].asset.metadata = {};
                for (const key of newKeys) {
                  if (!prevKeys.includes(key)) {
                    state.assets[id].asset.metadata[key] =
                      asset.asset.metadata[key];
                  } else if (
                    !shallow(
                      state.assets[id].asset.metadata[key],
                      asset.asset.metadata[key]
                    )
                  ) {
                    state.assets[id].asset.metadata[key] =
                      asset.asset.metadata[key];
                  }
                }
              }
            }
          }
          for (const id of state.assetIds) {
            if (!incoming[id]) {
              delete state.assets[id];
              delete state.assetErrors[id];
              delete state.lockedFields[id];
              delete state.assetIds[state.assetIds.indexOf(id)];
            }
          }
          if (state.loadingAssets) state.loadingAssets = false;
        });
        get().revalidateErrors();
        get().revalidateLocks();
      },
      setFields: incoming => {
        set(state => {
          for (const [id, field] of Object.entries(incoming) as [
            Id<"fields">,
            FieldType
          ][]) {
            if (state.fields[id] && fieldsEqual(state.fields[id], field))
              continue;
            if (!state.fieldIds.includes(id)) {
              state.fieldIds.push(id);
            }
            if (!state.fields[id]) {
              state.fields[id] = field;
            } else {
              if (state.fields[id].name !== field.name)
                state.fields[id].name = field.name;
              if (state.fields[id].slug !== field.slug)
                state.fields[id].slug = field.slug;
              if (state.fields[id].type !== field.type)
                state.fields[id].type = field.type;
              if (state.fields[id].required !== field.required)
                state.fields[id].required = field.required;
              if (state.fields[id].hidden !== field.hidden)
                state.fields[id].hidden = field.hidden;
              if (state.fields[id].extra && field.extra) {
                for (const key of Object.keys(field.extra)) {
                  const typedKey = key as keyof FieldType["extra"];
                  if (
                    !shallow(
                      state.fields[id].extra![typedKey],
                      field.extra[typedKey]
                    )
                  ) {
                    state.fields[id].extra![typedKey] = field.extra[typedKey];
                  }
                }
                for (const key of Object.keys(state.fields[id].extra!)) {
                  if (!(key in field.extra)) {
                    delete state.fields[id].extra![
                      key as keyof FieldType["extra"]
                    ];
                  }
                }
              }
            }
          }
          for (const id of state.fieldIds) {
            if (!incoming[id]) {
              delete state.fields[id];
              delete state.fieldIds[state.fieldIds.indexOf(id)];
            }
          }
        });
        get().revalidateErrors();
      },
      setViewer: viewer => {
        set(state => {
          if (state.viewer === viewer) return;
          state.viewer = viewer;
        });
        get().revalidateLocks();
      },
      setUsers: users =>
        set(state => {
          for (const user of users) {
            const p = state.users.find(u => u.id === user._id);
            if (p) {
              if (p.email !== user.email) {
                p.email = user.email;
              }
            } else {
              state.users.push({ id: user._id, email: user.email });
            }
          }
          for (const user of state.users) {
            if (!users.some(u => u._id === user.id)) {
              delete state.users[state.users.indexOf(user)];
            }
          }
        }),
      setSorting: sorting => {
        set(state => {
          for (const [fieldId, order] of Object.entries(sorting) as [
            Id<"fields">,
            "asc" | "desc"
          ][]) {
            if (state.sorting[fieldId] !== order) {
              state.sorting[fieldId] = order;
            }
          }
          for (const fieldId of Object.keys(state.sorting)) {
            if (!sorting[fieldId as Id<"fields">]) {
              delete state.sorting[fieldId as Id<"fields">];
            }
          }
        });
      },
      toggleSorting: fieldId => {
        set(state => {
          const current = state.sorting[fieldId];
          if (current === "asc") {
            state.sorting[fieldId] = "desc";
          } else if (current === "desc") {
            delete state.sorting[fieldId];
          } else {
            state.sorting[fieldId] = "asc";
          }
        });
      },
      toggleVisibility: fieldId => {
        set(state => {
          if (state.hiddenFields.includes(fieldId)) {
            for (let i = 0; i < state.hiddenFields.length; i++) {
              if (state.hiddenFields[i] === fieldId) {
                delete state.hiddenFields[i];
                break;
              }
            }
          } else {
            state.hiddenFields.push(fieldId);
          }
        });
      },
      toggleHiding: () => {
        set(state => {
          state.hiding = !state.hiding;
        });
      },
      setActiveViewId: activeView =>
        set(state => {
          state.activeViewId = activeView;
        }),
      setViews: views =>
        set(state => {
          for (const view of views) {
            state.views[view._id] = view;
          }
          for (const id of Object.keys(state.views)) {
            if (!views.some(v => v._id === id)) {
              delete state.views[id as Id<"views">];
            }
          }
        })
    }))
  )
);
