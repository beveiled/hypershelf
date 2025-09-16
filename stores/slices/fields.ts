import { Id } from "@/convex/_generated/dataModel";
import { FieldType } from "@/convex/schema";
import { validateFields } from "@/convex/utils";
import { fieldsEqual } from "@/lib/utils";
import { FieldsSlice, ImmerStateCreator } from "../types";
import { shallow } from "zustand/shallow";

export const fieldsSlice: ImmerStateCreator<FieldsSlice> = (set, get) => ({
  revalidateErrors: () =>
    set(state => {
      for (const [, asset] of Object.entries(state.assets)) {
        const errs = validateFields(
          Object.values(state.fields),
          asset.asset.metadata ?? {},
        );
        if (errs && Object.keys(errs).length > 0) {
          if (!state.assetErrors[asset.asset._id])
            state.assetErrors[asset.asset._id] = {};
          for (const [fieldId, error] of Object.entries(errs)) {
            if (
              state.assetErrors[asset.asset._id][fieldId as Id<"fields">] ===
              error
            )
              continue;
            state.assetErrors[asset.asset._id][fieldId as Id<"fields">] = error;
          }
          for (const fieldId of Object.keys(
            state.assetErrors[asset.asset._id],
          )) {
            if (!errs[fieldId]) {
              delete state.assetErrors[asset.asset._id][
                fieldId as Id<"fields">
              ];
            }
          }
        } else {
          delete state.assetErrors[asset.asset._id];
        }
      }
    }),
  setFields: incoming => {
    set(state => {
      for (const [id, field] of Object.entries(incoming) as [
        Id<"fields">,
        FieldType,
      ][]) {
        if (state.fields[id] && fieldsEqual(state.fields[id], field)) continue;
        if (!state.fieldIds.includes(id)) {
          state.fieldIds.push(id);
        }
        if (!state.fields[id]) {
          state.fields[id] = field;
        } else {
          if (state.fields[id].name !== field.name)
            state.fields[id].name = field.name;
          if (state.fields[id].slug !== field.slug)
            state.fields[id].slug = field.slug;
          if (state.fields[id].type !== field.type)
            state.fields[id].type = field.type;
          if (state.fields[id].required !== field.required)
            state.fields[id].required = field.required;
          if (state.fields[id].hidden !== field.hidden)
            state.fields[id].hidden = field.hidden;
          if (state.fields[id].extra && field.extra) {
            for (const key of Object.keys(field.extra)) {
              const typedKey = key as keyof FieldType["extra"];
              if (
                !shallow(
                  state.fields[id].extra![typedKey],
                  field.extra[typedKey],
                )
              ) {
                state.fields[id].extra![typedKey] = field.extra[typedKey];
              }
            }
            for (const key of Object.keys(state.fields[id].extra!)) {
              if (!(key in field.extra)) {
                delete state.fields[id].extra![key as keyof FieldType["extra"]];
              }
            }
          }
        }
      }
      for (const id of state.fieldIds) {
        if (!incoming[id]) {
          delete state.fields[id];
          delete state.fieldIds[state.fieldIds.indexOf(id)];
        }
      }
    });
    get().revalidateErrors();
  },
});
