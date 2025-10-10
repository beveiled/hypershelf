import type { ComponentPropsWithoutRef } from "react";
import type { ActionWithRulesProps } from "react-querybuilder";

import { cn } from "@hypershelf/lib/utils";
import { Button } from "@hypershelf/ui/primitives/button";

export type ShadcnUiActionProps = ActionWithRulesProps &
  ComponentPropsWithoutRef<typeof Button>;

export const ShadcnUiActionElementIcon = (props: ShadcnUiActionProps) => {
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
      size="icon"
      variant="ghost"
      className={cn(className, "flex-none")}
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

ShadcnUiActionElementIcon.displayName = "ShadcnUiActionElementIcon";
