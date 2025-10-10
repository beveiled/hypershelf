import type { ComponentPropsWithoutRef } from "react";
import type { ActionWithRulesProps } from "react-querybuilder";

import { Button } from "@hypershelf/ui/primitives/button";

export type ShadcnUiActionProps = ActionWithRulesProps &
  ComponentPropsWithoutRef<typeof Button>;

export const ShadcnUiActionElement = (props: ShadcnUiActionProps) => {
  const {
    className,
    label,
    title,
    disabled,
    disabledTranslation,
    // Props that should not be in extraProps
    testID: _testID,
    rules: _rules,
    level: _level,
    path: _path,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    context: _context,
    validation: _validation,
    ruleOrGroup: _ruleOrGroup,
    schema: _schema,
    ...extraProps
  } = props;
  return (
    <Button
      variant="ghost"
      size="sm"
      className={className}
      title={
        disabledTranslation && disabled ? disabledTranslation.title : title
      }
      onClick={(e) => props.handleOnClick(e)}
      disabled={disabled && !disabledTranslation}
      {...extraProps}
    >
      {disabledTranslation && disabled ? disabledTranslation.label : label}
    </Button>
  );
};

ShadcnUiActionElement.displayName = "ShadcnUiActionElement";
