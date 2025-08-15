import { ValueType } from "@/convex/schema";
import React from "react";
import { EditableKey } from "../consts";

export abstract class AbstractProp extends React.Component<{
  value: ValueType;
  lockField: () => void;
  isLockedBySomeoneElse: boolean;
  change: (key: EditableKey, value: ValueType) => void;
}> {
  abstract render(): React.ReactNode;
}
