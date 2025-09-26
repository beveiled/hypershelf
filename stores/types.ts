import { MagicFieldTypes } from "@/components/inventories/fields/fieldTypes";
import { Id } from "@/convex/_generated/dataModel";
import {
  ExtendedAssetType,
  ExtendedFieldType,
  ExtendedViewType,
} from "@/convex/schema";
import { Router, VM } from "@/lib/integrations/vsphere";
import { FolderTree } from "@/lib/integrations/vsphere/types";
import { Link } from "@/lib/types/flow";
import { StateCreator } from "zustand";

export type LockedFields = Record<Id<"assets">, Record<Id<"fields">, string>>;
export type AssetErrors = Record<Id<"assets">, Record<Id<"fields">, string>>;
export type AssetsDict = Record<Id<"assets">, ExtendedAssetType>;
export type FieldsDict = Record<Id<"fields">, ExtendedFieldType>;
export type UsersDict = Record<Id<"users">, string>;
export type SortingDict = Record<Id<"fields">, "asc" | "desc">;
export type ViewsDict = Record<Id<"views">, ExtendedViewType>;
export type AssetsLocker = {
  acquire: (assetId: Id<"assets">, fieldId: Id<"fields">) => Promise<boolean>;
  release: (assetId: Id<"assets">, fieldId: Id<"fields">) => Promise<void>;
};
export type FieldsLocker = {
  acquire: (fieldId: Id<"fields">) => Promise<boolean>;
  release: (fieldId: Id<"fields">) => Promise<void>;
};
export type NetworkTopology = {
  hosts: {
    hostname: string;
    id: string;
    neighbors: { id: string; attributes?: (string | number)[] }[];
  }[];
};

export type State = {
  assetIds: Id<"assets">[];
  assets: AssetsDict;
  assetErrors: AssetErrors;
  loadingAssets: boolean;

  fieldIds: Id<"fields">[];
  fields: FieldsDict;
  lockedFields: LockedFields;
  expandedFieldId: Id<"fields"> | null;
  loadingFields: boolean;
  magicFields: { [key in MagicFieldTypes]?: Id<"fields"> };

  hiding: boolean;
  sorting: SortingDict;
  hiddenFields: Id<"fields">[];
  fieldOrder: Id<"fields">[];

  views: ViewsDict;
  activeViewId: Id<"views"> | null;

  users: UsersDict;
  viewer: Id<"users"> | null | undefined;
  assetsLocker: AssetsLocker;
  fieldsLocker: FieldsLocker;

  links: Link[];
  routers: Router[];
  vms: VM[];
  selectedVmNodesNetworkTopologyView: Record<string, boolean>;
  topologyFetchTime: string | null;
  folderTree: FolderTree;
  rootMoid: string | null;
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
  setAssetsLocker: (locker: AssetsLocker) => void;
  lookupAsset: (args: {
    hostname?: string;
    ip?: string;
  }) => ExtendedAssetType | undefined;
};

export type FieldsSlice = {
  setFields: (fields: FieldsDict) => void;
  revalidateErrors: () => void;
  setExpandedFieldId: (fieldId: Id<"fields"> | null) => void;
  setFieldsLocker: (locker: FieldsLocker) => void;
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

export type SchemasSlice = {
  updateTopology: (topology: {
    routers: Router[];
    vms: VM[];
    fetchTime: string;
  }) => void;
  updateNetworkTopology: (network: NetworkTopology) => void;
  toggleVmNodeNetworkTopologyView: (vmId: string, state?: boolean) => void;
  setFolderTree: (tree: FolderTree) => void;
  setRootMoid: (rootMoid: string) => void;
};

export type Actions = TableSlice &
  AssetsSlice &
  FieldsSlice &
  ViewsSlice &
  UsersSlice &
  SharedSlice &
  SchemasSlice;

export type ImmerStateCreator<T> = StateCreator<
  Actions & State,
  [["zustand/immer", never], never],
  [],
  T
>;
