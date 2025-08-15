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

const fieldProps = [
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

export type FieldPropType = (typeof allFieldProps)[number]["component"];

export function getFieldProps(typeExtras: string[]) {
  return allFieldProps.filter(
    prop =>
      typeExtras.includes(prop.key) ||
      ["name", "icon", "description", "hideFromSearch", "required", "hidden"].includes(prop.key)
  );
}
