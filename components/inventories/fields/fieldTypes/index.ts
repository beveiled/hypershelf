import { FieldType } from "@/convex/schema";
import { FieldPropConfig } from "./_abstractType";
import arrayTypeConfig from "./array";
import booleanTypeConfig from "./boolean";
import dateTypeConfig from "./date";
import emailTypeConfig from "./email";
import ipTypeConfig from "./ip";
import magicHostnameConfig from "./magicHostname";
import magicIPConfig from "./magicIp";
import markdownTypeConfig from "./markdown";
import numberTypeConfig from "./number";
import selectTypeConfig from "./select";
import stringTypeConfig from "./string";
import urlTypeConfig from "./url";
import userTypeConfig from "./user";
import { WithoutSystemFields } from "convex/server";

const plainFieldTypesRaw = [
  arrayTypeConfig,
  booleanTypeConfig,
  dateTypeConfig,
  emailTypeConfig,
  ipTypeConfig,
  markdownTypeConfig,
  numberTypeConfig,
  selectTypeConfig,
  stringTypeConfig,
  urlTypeConfig,
  userTypeConfig,
];
export const magicFieldTypesRaw = [magicHostnameConfig, magicIPConfig];
export const fieldTypes: FieldPropConfig[] = [
  ...plainFieldTypesRaw,
  ...magicFieldTypesRaw,
];
export const fieldTypesMap: Record<
  PlainFieldTypes | MagicFieldTypes,
  FieldPropConfig
> = fieldTypes.reduce(
  (acc, curr) => {
    acc[curr.key as PlainFieldTypes | MagicFieldTypes] = curr;
    return acc;
  },
  {} as Record<PlainFieldTypes | MagicFieldTypes, FieldPropConfig>,
);

export const getPropsForType = (type: string) =>
  fieldTypes.find(t => t.key === type)?.fieldProps ?? [];

export type MagicFieldTypes = (typeof magicFieldTypesRaw)[number]["key"];
export type PlainFieldTypes = (typeof plainFieldTypesRaw)[number]["key"];
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
