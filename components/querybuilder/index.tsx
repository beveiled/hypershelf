/*
https://github.com/hikariatama/hypershelf
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
import {
  X,
  Copy,
  Unlock,
  Lock,
  ChevronDown,
  ChevronUp,
  Plus
} from "lucide-react";
import type {
  Classnames,
  Controls,
  FullField,
  Translations
} from "react-querybuilder";
import { getCompatContextProvider } from "react-querybuilder";
import { ShadcnUiActionElement } from "./ShadcnUiActionElement";
import { ShadcnUiActionElementIcon } from "./ShadcnUiActionElementIcon";
import { ShadcnUiValueEditor } from "./ShadcnUiValueEditor";
import { ShadcnUiValueSelector } from "./ShadcnUiValueSelector";
import { ShadcnUiNotToggle } from "./ShadcnUiNotToggle";
import { ShadcnUiDragHandle } from "./ShadcnUiDragHandle";

import "./styles.scss";

export * from "./ShadcnUiActionElement";
export * from "./ShadcnUiValueSelector";

export const shadcnUiControlClassnames = {
  ruleGroup: "rounded-md !border-0 bg-background !p-0"
} satisfies Partial<Classnames>;

export const shadcnUiControlElements = {
  actionElement: ShadcnUiActionElement,
  removeGroupAction: ShadcnUiActionElementIcon,
  removeRuleAction: ShadcnUiActionElementIcon,
  valueSelector: ShadcnUiValueSelector,
  valueEditor: ShadcnUiValueEditor,
  notToggle: ShadcnUiNotToggle,
  dragHandle: ShadcnUiDragHandle
} satisfies Partial<Controls<FullField, string>>;

export const shadcnUiTranslations = {
  addRule: {
    label: (
      <>
        <Plus className="mr-2 h-4 w-4" /> Rule
      </>
    )
  },
  addGroup: {
    label: (
      <>
        <Plus className="mr-2 h-4 w-4" /> Group
      </>
    )
  },
  removeGroup: { label: <X className="h-4 w-4" /> },
  removeRule: { label: <X className="h-4 w-4" /> },
  cloneRuleGroup: { label: <Copy className="h-4 w-4" /> },
  cloneRule: { label: <Copy className="h-4 w-4" /> },
  lockGroup: { label: <Unlock className="h-4 w-4" /> },
  lockRule: { label: <Unlock className="h-4 w-4" /> },
  lockGroupDisabled: { label: <Lock className="h-4 w-4" /> },
  lockRuleDisabled: { label: <Lock className="h-4 w-4" /> },
  shiftActionDown: { label: <ChevronDown className="h-4 w-4" /> },
  shiftActionUp: { label: <ChevronUp className="h-4 w-4" /> }
} satisfies Partial<Translations>;

export const QueryBuilderShadcnUi = getCompatContextProvider({
  controlClassnames: shadcnUiControlClassnames,
  controlElements: shadcnUiControlElements,
  translations: shadcnUiTranslations
});
