import { assetsSlice } from "./slices/assets";
import { fieldsSlice } from "./slices/fields";
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

  hiding: true,
  sorting: {},
  hiddenFields: [],
  fieldOrder: [],

  views: {},
  activeViewId: null,

  users: {},
  viewer: null,
  locker: {
    acquire: async () => false,
    release: async () => {},
  },
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
    })),
  ),
);
