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
import { FieldPropConfig } from "./_abstractProp";
import DescriptionProp from "./description";
import HiddenProp from "./hidden";
import HideFromSearchProp from "./hideFromSearch";
import IconProp from "./icon";
import ListObjectTypeProp from "./listObjectType";
import MaxItemsProp from "./maxItems";
import MaxLengthProp from "./maxLength";
import MaxValueProp from "./maxValue";
import MarkdownPresetProp from "./mdPreset";
import MinItemsProp from "./minItems";
import MinLengthProp from "./minLength";
import MinValueProp from "./minValue";
import NameProp from "./name";
import OptionsProp from "./options";
import PlaceholderProp from "./placeholder";
import RegexProp from "./regex";
import RegexErrorProp from "./regexError";
import RequiredProp from "./required";
import SubnetProp from "./subnet";

export const fieldProps = [
  ListObjectTypeProp,
  MaxItemsProp,
  MaxLengthProp,
  MaxValueProp,
  MarkdownPresetProp,
  MinItemsProp,
  MinLengthProp,
  MinValueProp,
  OptionsProp,
  PlaceholderProp,
  RegexProp,
  RegexErrorProp,
  SubnetProp
];

const allFieldProps = [
  NameProp,
  IconProp,
  DescriptionProp,
  ...fieldProps,
  HideFromSearchProp,
  RequiredProp,
  HiddenProp
];

export type FieldPropType = FieldPropConfig["component"];

export function getFieldProps(typeExtras: string[]) {
  return allFieldProps.filter(
    prop =>
      typeExtras.includes(prop.prop) ||
      [
        "name",
        "icon",
        "description",
        "hideFromSearch",
        "required",
        "hidden"
      ].includes(prop.prop)
  );
}
