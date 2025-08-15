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

export const FIELD_TYPES = [
  {
    value: "string",
    icon: "case-sensitive",
    label: "String",
    extras: ["placeholder", "regex", "regexError", "minLength", "maxLength"]
  },
  {
    value: "number",
    icon: "hash",
    label: "Number",
    extras: ["placeholder", "minValue", "maxValue"]
  },
  {
    value: "boolean",
    icon: "square-check",
    label: "Boolean",
    extras: []
  },
  {
    value: "array",
    icon: "brackets",
    label: "Array",
    extras: [
      "placeholder",
      "minItems",
      "maxItems",
      "listObjectType",
      "listObjectExtra"
    ]
  },
  { value: "select", icon: "list-todo", label: "Select", extras: ["options"] },
  { value: "date", icon: "calendar", label: "Date", extras: ["placeholder"] },
  { value: "email", icon: "at-sign", label: "Email", extras: ["placeholder"] },
  {
    value: "user",
    icon: "circle-user",
    label: "User",
    extras: ["placeholder"]
  },
  { value: "url", icon: "link-2", label: "URL", extras: ["placeholder"] },
  {
    value: "ip",
    icon: "ethernet-port",
    label: "IP Address",
    extras: ["placeholder", "subnet"]
  },
  {
    value: "markdown",
    icon: "file-text",
    label: "Markdown",
    extras: ["placeholder", "md-preset"]
  }
];

export const getExtrasForType = (type: string) =>
  FIELD_TYPES.find(t => t.value === type)?.extras ?? [];

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
