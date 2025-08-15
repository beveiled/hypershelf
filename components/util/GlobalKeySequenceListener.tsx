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
import { useEffect, useRef } from "react";

type GlobalKeySequenceListenerProps = {
  onMatch: () => void;
};

export function GlobalKeySequenceListener({
  onMatch
}: GlobalKeySequenceListenerProps) {
  const buffer = useRef<string>("");

  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      const active = document.activeElement;
      if (
        active &&
        (active.tagName === "INPUT" ||
          active.tagName === "TEXTAREA" ||
          (active as HTMLElement).isContentEditable)
      ) {
        return;
      }

      const char = e.key.length === 1 ? e.key : "";
      if (!char) return;

      buffer.current += char.toLowerCase();
      buffer.current = buffer.current.slice(-6);

      if (buffer.current === "galina") {
        onMatch();
        buffer.current = "";
      }
    };

    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [onMatch]);

  return null;
}
