import { assetsSlice } from "./slices/assets";
import { fieldsSlice } from "./slices/fields";
import { schemasSlice } from "./slices/schemas";
import { sharedSlice } from "./slices/shared";
import { tableSlice } from "./slices/table";
import { usersSlice } from "./slices/users";
import { viewsSlice } from "./slices/views";
import { Actions, State } from "./types";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

const initialState: State = {
  assetIds: [],
  assets: {},
  assetErrors: {},
  loadingAssets: true,

  fieldIds: [],
  fields: {},
  lockedFields: {},
  expandedFieldId: null,
  loadingFields: true,

  hiding: true,
  sorting: {},
  hiddenFields: [],
  fieldOrder: [],

  views: {},
  activeViewId: null,

  users: {},
  viewer: null,
  assetsLocker: {
    acquire: async () => false,
    release: async () => {},
  },
  fieldsLocker: {
    acquire: async () => false,
    release: async () => {},
  },

  links: [],
  routers: [],
  vms: [],
  selectedVmNodesNetworkTopologyView: {},
  topologyFetchTime: null,
  folderTree: { id: "root", name: "Root", children: [] },
  rootMoid: null,
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
