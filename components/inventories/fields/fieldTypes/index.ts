/*
https://github.com/beveiled/hypershelf
Copyright (C) 2025  Daniil Gazizullin

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/
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
