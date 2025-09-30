import { ShadcnUiActionElement } from "./ShadcnUiActionElement";
import { ShadcnUiActionElementIcon } from "./ShadcnUiActionElementIcon";
import { ShadcnUiDragHandle } from "./ShadcnUiDragHandle";
import { ShadcnUiNotToggle } from "./ShadcnUiNotToggle";
import { ShadcnUiValueEditor } from "./ShadcnUiValueEditor";
import { ShadcnUiValueSelector } from "./ShadcnUiValueSelector";
import "./styles.scss";
import {
  ChevronDown,
  ChevronUp,
  Copy,
  Lock,
  Plus,
  Unlock,
  X,
} from "lucide-react";
import type {
  Classnames,
  Controls,
  FullField,
  Translations,
} from "react-querybuilder";
import { getCompatContextProvider } from "react-querybuilder";

export * from "./ShadcnUiActionElement";
export * from "./ShadcnUiValueSelector";

export const shadcnUiControlClassnames = {
  ruleGroup: "rounded-md",
} satisfies Partial<Classnames>;

export const shadcnUiControlElements = {
  actionElement: ShadcnUiActionElement,
  removeGroupAction: ShadcnUiActionElementIcon,
  removeRuleAction: ShadcnUiActionElementIcon,
  valueSelector: ShadcnUiValueSelector,
  valueEditor: ShadcnUiValueEditor,
  notToggle: ShadcnUiNotToggle,
  dragHandle: ShadcnUiDragHandle,
} satisfies Partial<Controls<FullField, string>>;

export const shadcnUiTranslations = {
  addRule: {
    label: (
      <>
        <Plus className="size-4" /> Правило
      </>
    ),
  },
  addGroup: {
    label: (
      <>
        <Plus className="size-4" /> Группа
      </>
    ),
  },
  removeGroup: { label: <X className="size-4" /> },
  removeRule: { label: <X className="size-4" /> },
  cloneRuleGroup: { label: <Copy className="size-4" /> },
  cloneRule: { label: <Copy className="size-4" /> },
  lockGroup: { label: <Unlock className="size-4" /> },
  lockRule: { label: <Unlock className="size-4" /> },
  lockGroupDisabled: { label: <Lock className="size-4" /> },
  lockRuleDisabled: { label: <Lock className="size-4" /> },
  shiftActionDown: { label: <ChevronDown className="size-4" /> },
  shiftActionUp: { label: <ChevronUp className="size-4" /> },
} satisfies Partial<Translations>;

export const QueryBuilderShadcnUi = getCompatContextProvider({
  controlClassnames: shadcnUiControlClassnames,
  controlElements: shadcnUiControlElements,
  translations: shadcnUiTranslations,
});
