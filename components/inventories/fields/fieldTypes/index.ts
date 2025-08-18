import { FieldType } from "@/convex/schema";
import { WithoutSystemFields } from "convex/server";
import ArrayTypeConfig from "./array";
import BooleanTypeConfig from "./boolean";
import DateTypeConfig from "./date";
import EmailTypeConfig from "./email";
import IPTypeConfig from "./ip";
import NumberTypeConfig from "./number";
import SelectTypeConfig from "./select";
import StringTypeConfig from "./string";
import URLTypeConfig from "./url";
import UserTypeConfig from "./user";

export const fieldTypes = [
  ArrayTypeConfig,
  BooleanTypeConfig,
  DateTypeConfig,
  EmailTypeConfig,
  IPTypeConfig,
  NumberTypeConfig,
  SelectTypeConfig,
  StringTypeConfig,
  URLTypeConfig,
  UserTypeConfig
];

export const getPropsForType = (type: string) =>
  fieldTypes.find(t => t.key === type)?.fieldProps ?? [];

export type NonSystemKeys = "name" | "type" | "required" | "hidden";
export type SystemKeys = Exclude<
  keyof WithoutSystemFields<FieldType>,
  "slug" | "extra" | NonSystemKeys
>;
export type ExtraRootKeys = keyof NonNullable<
  WithoutSystemFields<FieldType>["extra"]
>;
export type ListObjectExtraType = NonNullable<
  NonNullable<FieldType["extra"]>["listObjectExtra"]
>;
export type NestedExtraKey = `listObjectExtra.${keyof ListObjectExtraType}`;
export type EditableKey = NonSystemKeys | ExtraRootKeys | NestedExtraKey;
