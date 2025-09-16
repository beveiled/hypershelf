"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import * as React from "react";
import { isOptionGroupArray } from "react-querybuilder";
import type { OptionList } from "react-querybuilder";

export type MultiSelectProps = {
  options?: OptionList;
  value: string[];
  onValueChange: (value: string[]) => void;
};

export function MultiSelect({
  options = [],
  value,
  onValueChange,
}: MultiSelectProps) {
  const toDropdownOptions = (list: OptionList) =>
    isOptionGroupArray(list)
      ? list.map(og => (
          <React.Fragment key={og.label}>
            <DropdownMenuLabel>{og.label}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {og.options.map(opt => (
              <DropdownMenuCheckboxItem
                key={opt.name}
                disabled={!!opt.disabled}
                checked={value.includes(opt.name ?? "")}
                onCheckedChange={checked => {
                  onValueChange(
                    checked
                      ? [...value, opt.name ?? ""]
                      : value.filter(v => v !== opt.name),
                  );
                }}
              >
                {opt.label}
              </DropdownMenuCheckboxItem>
            ))}
          </React.Fragment>
        ))
      : Array.isArray(list)
        ? list.map(opt => (
            <DropdownMenuCheckboxItem
              key={opt.name}
              disabled={!!opt.disabled}
              checked={value.includes(opt.name)}
              onCheckedChange={checked => {
                onValueChange(
                  checked
                    ? [...value, opt.name]
                    : value.filter(v => v !== opt.name),
                );
              }}
            >
              {opt.label}
            </DropdownMenuCheckboxItem>
          ))
        : null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("flex gap-x-1", value.length > 0 && "px-1")}
        >
          {[...value].slice(0, 5).map(it => (
            <div key={it} className="bg-accent rounded-sm px-3 py-0.5 text-sm">
              {it}
            </div>
          ))}
          {value.length > 5 && (
            <div className="bg-accent rounded-sm px-3 py-0.5 text-sm">
              +{value.length - 5}
            </div>
          )}
          {value.length === 0 && "Выбери..."}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>{toDropdownOptions(options)}</DropdownMenuContent>
    </DropdownMenu>
  );
}
