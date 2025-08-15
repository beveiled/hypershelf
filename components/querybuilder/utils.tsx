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
import { SelectGroup, SelectItem, SelectLabel } from "@/components/ui/select";
import type { OptionList } from "react-querybuilder";
import { isOptionGroupArray } from "react-querybuilder";

export const toSelectOptions = (list: OptionList) =>
  isOptionGroupArray(list)
    ? list.map(og => (
        <SelectGroup key={og.label}>
          <SelectLabel>{og.label}</SelectLabel>
          {og.options.map(opt => (
            <SelectItem
              key={opt.name}
              value={opt.name ?? ""}
              disabled={!!opt.disabled}
            >
              {opt.label}
            </SelectItem>
          ))}
        </SelectGroup>
      ))
    : Array.isArray(list)
      ? list.map(opt => (
          <SelectItem
            key={opt.name}
            value={opt.name ?? ""}
            disabled={!!opt.disabled}
          >
            {opt.label}
          </SelectItem>
        ))
      : null;
