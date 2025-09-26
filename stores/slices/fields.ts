import { Id } from "@/convex/_generated/dataModel";
import { ExtendedFieldType, FieldType } from "@/convex/schema";
import { validateFields } from "@/convex/utils";
import { fieldsEqual } from "@/lib/utils";
import { FieldsSlice, ImmerStateCreator } from "../types";
import { shallow } from "zustand/shallow";

export const fieldsSlice: ImmerStateCreator<FieldsSlice> = (set, get) => ({
  revalidateErrors: () =>
    set(state => {
      for (const [, asset] of Object.entries(state.assets)) {
        const errs = validateFields(
          Object.values(state.fields).map(f => f.field),
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
        ExtendedFieldType,
      ][]) {
        if (
          state.fields[id] &&
          fieldsEqual(state.fields[id].field, field.field)
        )
          continue;
        if (!state.fieldIds.includes(id)) {
          state.fieldIds.push(id);
        }
        if (!state.fields[id]) {
          state.fields[id] = field;
        } else {
          if (state.fields[id].field.name !== field.field.name)
            state.fields[id].field.name = field.field.name;
          if (state.fields[id].field.slug !== field.field.slug)
            state.fields[id].field.slug = field.field.slug;
          if (state.fields[id].field.type !== field.field.type)
            state.fields[id].field.type = field.field.type;
          if (state.fields[id].field.required !== field.field.required)
            state.fields[id].field.required = field.field.required;
          if (state.fields[id].field.hidden !== field.field.hidden)
            state.fields[id].field.hidden = field.field.hidden;
          if (state.fields[id].field.editingBy !== field.field.editingBy)
            state.fields[id].field.editingBy = field.field.editingBy;
          if (state.fields[id].editingBy?.id !== field.editingBy?.id)
            state.fields[id].editingBy = field.editingBy;
          if (state.fields[id].field.extra && field.field.extra) {
            for (const key of Object.keys(field.field.extra)) {
              const typedKey = key as keyof FieldType["extra"];
              if (
                !shallow(
                  state.fields[id].field.extra![typedKey],
                  field.field.extra[typedKey],
                )
              ) {
                state.fields[id].field.extra![typedKey] =
                  field.field.extra[typedKey];
              }
            }
            for (const key of Object.keys(state.fields[id].field.extra!)) {
              if (!(key in field.field.extra)) {
                delete state.fields[id].field.extra![
                  key as keyof FieldType["extra"]
                ];
              }
            }
          }
        }
      }
      for (const id of state.fieldIds) {
        if (!incoming[id]) {
          delete state.fields[id];
          state.fieldIds.splice(state.fieldIds.indexOf(id), 1);
        }
      }
    });
    get().revalidateErrors();
    set(state => {
      if (state.loadingFields) state.loadingFields = false;
    });
  },
  setExpandedFieldId: fieldId => {
    set(state => {
      state.expandedFieldId = fieldId;
    });
  },
  setFieldsLocker: locker =>
    set(state => {
      state.fieldsLocker = locker;
    }),
});
