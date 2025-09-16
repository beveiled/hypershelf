import { Id } from "@/convex/_generated/dataModel";
import { ExtendedViewType } from "@/convex/schema";
import { ImmerStateCreator, ViewsSlice } from "../types";
import { shallow } from "zustand/shallow";

export const viewsSlice: ImmerStateCreator<ViewsSlice> = (set, get) => ({
  setActiveViewId: activeView => {
    set(state => {
      if (state.activeViewId === activeView) return;
      if (activeView && !state.views[activeView]) {
        console.warn("Tried to set unknown view as active:", activeView);
        return;
      }
      state.activeViewId = activeView;
    });
    if (activeView) get().applyView(activeView);
  },
  applyView: viewId => {
    const state = get();
    if (!state.views[viewId]) {
      console.warn("Tried to apply unknown view:", viewId);
      return;
    }
    const view = state.views[viewId];
    set(state => {
      state.sorting = { ...view.sorting };
      state.hiddenFields = [...(view.hiddenFields || [])];
      state.fieldOrder = [...(view.fieldOrder || [])];
    });
  },
  setViews: views =>
    set(state => {
      for (const [id, view] of Object.entries(views) as [
        Id<"views">,
        ExtendedViewType,
      ][]) {
        if (state.views[id] && shallow(state.views[id], view)) continue;
        state.views[id] = view;
      }
      for (const id of Object.keys(state.views)) {
        if (!views[id as Id<"views">]) {
          delete state.views[id as Id<"views">];
          if (state.activeViewId === id) {
            state.activeViewId = null;
          }
        }
      }
    }),
});
