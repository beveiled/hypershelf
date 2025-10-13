import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

import type { Actions, State } from "./types";
import { assetsSlice } from "./slices/assets";
import { fieldsSlice } from "./slices/fields";
import { schemasSlice } from "./slices/schemas";
import { sharedSlice } from "./slices/shared";
import { tableSlice } from "./slices/table";
import { usersSlice } from "./slices/users";
import { viewsSlice } from "./slices/views";

const initialState: State = {
  assetIds: [],
  assets: {},
  assetErrors: {},
  loadingAssets: true,
  createdAssets: [],

  fieldIds: [],
  fields: {},
  lockedFields: {},
  expandedFieldId: null,
  loadingFields: true,
  magicFields: {},

  hiding: true,
  sorting: {},
  filters: null,
  isFiltering: false,
  hiddenFields: [],
  fieldOrder: [],

  views: {},
  activeViewId: null,

  users: {},
  viewer: null,
  assetsLocker: {
    acquire: () => new Promise(() => false),
    release: () => new Promise(() => false),
  },
  fieldsLocker: {
    acquire: () => new Promise(() => false),
    release: () => new Promise(() => false),
  },

  links: [],
  routers: [],
  vms: [],
  selectedVmNodesNetworkTopologyView: {},
  topologyFetchTime: null,
  folderTree: { id: "root", name: "Root", children: [] },
  rootMoid: null,
  highlightLink: null,
};

export const useHypershelf = create<State & Actions>()(
  devtools(
    immer((...args) => ({
      ...initialState,
      ...usersSlice(...args),
      ...assetsSlice(...args),
      ...fieldsSlice(...args),
      ...tableSlice(...args),
      ...viewsSlice(...args),
      ...sharedSlice(...args),
      ...schemasSlice(...args),
    })),
  ),
);
