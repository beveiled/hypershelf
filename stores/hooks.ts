import { filtersEqual } from "@/lib/utils/zustand";
import { useHypershelf } from ".";
import { isEqual } from "lodash";

export const useIsViewDirty = () => {
  return useHypershelf(state => {
    const view = (state.activeViewId
      ? state.views[state.activeViewId]
      : null) ?? {
      _id: "",
      name: "Default",
      global: false,
      builtin: true,
      sorting: {},
      fieldOrder: [],
      hiddenFields: [],
      enableFiltering: false,
      filters: undefined,
    };

    return (
      !isEqual(view.sorting || {}, state.sorting) ||
      !isEqual(view.fieldOrder || [], state.fieldOrder) ||
      !isEqual(view.hiddenFields || [], state.hiddenFields) ||
      (view.enableFiltering ?? false) !== state.isFiltering ||
      !filtersEqual(
        view.filters || { combinator: "and", rules: [] },
        state.filters || { combinator: "and", rules: [] },
      )
    );
  });
};
