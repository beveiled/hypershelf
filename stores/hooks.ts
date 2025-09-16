import { shallowPositional } from "@/lib/utils";
import { useHypershelf } from ".";
import { shallow } from "zustand/shallow";

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
    };
    return (
      !shallow(view.sorting || {}, state.sorting) ||
      !shallowPositional(view.fieldOrder || [], state.fieldOrder) ||
      !shallowPositional(view.hiddenFields || [], state.hiddenFields)
    );
  });
};
