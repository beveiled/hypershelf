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
"use client";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { JsonViewer, type JsonViewerProps } from "../ui/json-viewer";

type DebuggerProps = {
  open: boolean;
  setIsOpen: (isOpen: boolean) => void;
  children?: React.ReactNode;
} & JsonViewerProps;

export function Debugger(props: DebuggerProps) {
  return (
    <AlertDialog open={props.open} onOpenChange={props.setIsOpen}>
      <AlertDialogContent className="max-h-[60vh] !max-w-2xl overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle>Debug Information</AlertDialogTitle>
        </AlertDialogHeader>
        <JsonViewer {...props} className="text-xs" />
        <AlertDialogFooter>
          {props.children}
          <AlertDialogCancel>Close</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
