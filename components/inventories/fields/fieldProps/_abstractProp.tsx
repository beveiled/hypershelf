import { ValueType } from "@/convex/schema";
import { EditableKey } from "../fieldTypes";
import React from "react";

export type FieldPropArgs = {
  value: ValueType;
  setValue: (value: ValueType) => void;
  disabled: boolean;
  lockField: () => void;
  label: string;
};

export type FieldPropConfig = {
  prop: EditableKey;
  label: string;
  component: (args: FieldPropArgs) => React.ReactNode;
  full?: boolean;
};
