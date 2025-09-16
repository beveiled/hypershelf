import { ImmerStateCreator, SharedSlice } from "../types";

export const sharedSlice: ImmerStateCreator<SharedSlice> = (set, get) => ({
  setViewer: viewer => {
    set(state => {
      if (state.viewer === viewer) return;
      state.viewer = viewer;
    });
    get().revalidateLocks();
  },
  init: () => {
    set(state => {
      const storedHiding = localStorage.getItem("hiding");
      if (storedHiding === "0") {
        state.hiding = false;
      } else if (storedHiding === "1") {
        state.hiding = true;
      }
    });
  },
});
