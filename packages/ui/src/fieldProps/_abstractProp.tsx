import type React from "react";

import type { ValueType } from "@hypershelf/convex/schema";

import type { EditableKey } from "../fieldTypes";

export interface FieldPropArgs {
  value: ValueType;
  setValue: (value: ValueType) => void;
  disabled: boolean;
  lockField: () => void;
  label: string;
}

export interface FieldPropConfig {
  prop: EditableKey;
  label: string;
  component: (args: FieldPropArgs) => React.ReactNode;
  full?: boolean;
}
