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
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { MarkdownEditor } from "./index";

export function MarkdownEditorPopup({
  content,
  className = "",
  onClose = () => {},
  preview = false
}: {
  content: string;
  className?: string;
  onClose?: () => void;
  preview?: boolean;
}) {
  return (
    <AlertDialog open={true} onOpenChange={() => {}}>
      <VisuallyHidden>
        <AlertDialogTitle className="text-lg font-semibold">
          Markdown Preview
        </AlertDialogTitle>
      </VisuallyHidden>
      <AlertDialogContent
        className={`!bg-card !w-[90vw] !border-0 !p-0 ${className}`}
      >
        <div className="relative">
          <MarkdownEditor
            value={content}
            disabled={true}
            defaultExpanded={true}
            preview={preview}
            className="bg-card !max-h-[90vh] overflow-y-scroll"
          />
          <motion.button
            initial={{ rotate: 0 }}
            whileHover={{ rotate: 90 }}
            transition={{ type: "spring", stiffness: 500, damping: 35 }}
            className="hover:bg-input absolute right-2 bottom-2 z-10 cursor-pointer rounded-2xl p-1 shadow-md backdrop-blur-lg transition-colors hover:shadow-lg"
            onClick={() => onClose()}
          >
            <X className="size-5" />
          </motion.button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
