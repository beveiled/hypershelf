import { Id } from "@/convex/_generated/dataModel";
import { ExtendedAssetType } from "@/convex/assets";
import { ExtendedViewType, FieldType } from "@/convex/schema";
import { StateCreator } from "zustand";

export type LockedFields = Record<Id<"assets">, Record<Id<"fields">, string>>;
export type AssetErrors = Record<Id<"assets">, Record<Id<"fields">, string>>;
export type AssetsDict = Record<Id<"assets">, ExtendedAssetType>;
export type FieldsDict = Record<Id<"fields">, FieldType>;
export type UsersDict = Record<Id<"users">, string>;
export type SortingDict = Record<Id<"fields">, "asc" | "desc">;
export type ViewsDict = Record<Id<"views">, ExtendedViewType>;
export type Locker = {
  acquire: (assetId: Id<"assets">, fieldId: Id<"fields">) => Promise<boolean>;
  release: (assetId: Id<"assets">, fieldId: Id<"fields">) => Promise<void>;
};

export type State = {
  assetIds: Id<"assets">[];
  assets: AssetsDict;
  assetErrors: AssetErrors;
  loadingAssets: boolean;

  fieldIds: Id<"fields">[];
  fields: FieldsDict;
  lockedFields: LockedFields;

  hiding: boolean;
  sorting: SortingDict;
  hiddenFields: Id<"fields">[];
  fieldOrder: Id<"fields">[];

  views: ViewsDict;
  activeViewId: Id<"views"> | null;

  users: UsersDict;
  viewer: Id<"users"> | null | undefined;
  locker: Locker;
};

export type TableSlice = {
  setSorting: (sorting: SortingDict) => void;
  toggleSorting: (fieldId: Id<"fields">) => void;
  toggleVisibility: (fieldId: Id<"fields">) => void;
  toggleHiding: () => void;
  reorderField: (from: Id<"fields">, to: Id<"fields">) => void;
};

export type AssetsSlice = {
  setAssets: (assets: AssetsDict) => void;
  revalidateLocks: () => void;
  setLocker: (locker: Locker) => void;
};

export type FieldsSlice = {
  setFields: (fields: FieldsDict) => void;
  revalidateErrors: () => void;
};

export type ViewsSlice = {
  setViews: (views: ViewsDict) => void;
  applyView: (viewId: Id<"views">) => void;
  setActiveViewId: (activeView: Id<"views"> | null) => void;
};

export type UsersSlice = {
  setUsers: (users: UsersDict) => void;
};

export type SharedSlice = {
  setViewer: (viewer: Id<"users"> | null | undefined) => void;
  init: () => void;
};

export type Actions = TableSlice &
  AssetsSlice &
  FieldsSlice &
  ViewsSlice &
  UsersSlice &
  SharedSlice;

export type ImmerStateCreator<T> = StateCreator<
  Actions & State,
  [["zustand/immer", never], never],
  [],
  T
>;
