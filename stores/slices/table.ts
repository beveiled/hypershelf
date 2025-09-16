import { Id } from "@/convex/_generated/dataModel";
import { shallowPositional } from "@/lib/utils";
import { ImmerStateCreator, TableSlice } from "../types";

export const tableSlice: ImmerStateCreator<TableSlice> = set => ({
  toggleHiding: () => {
    set(state => {
      state.hiding = !state.hiding;
      localStorage.setItem("hiding", state.hiding ? "1" : "0");
    });
  },
  setSorting: sorting => {
    set(state => {
      for (const [fieldId, order] of Object.entries(sorting) as [
        Id<"fields">,
        "asc" | "desc",
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
            state.hiddenFields.splice(i, 1);
            break;
          }
        }
      } else {
        state.hiddenFields.push(fieldId);
      }
    });
  },
  reorderField: (from, to) =>
    set(state => {
      if (state.fieldOrder.length === 0) {
        state.fieldOrder = [...state.fieldIds];
      }
      const fromIndex = state.fieldOrder.indexOf(from);
      const toIndex = state.fieldOrder.indexOf(to);
      if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return;
      state.fieldOrder.splice(fromIndex, 1);
      state.fieldOrder.splice(toIndex, 0, from);
      if (shallowPositional(state.fieldOrder, state.fieldIds)) {
        state.fieldOrder = [];
      }
    }),
});
