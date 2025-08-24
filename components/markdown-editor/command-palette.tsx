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
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut
} from "@/components/ui/command";
import { EditorView } from "@codemirror/view";
import { DynamicIcon, IconName } from "lucide-react/dynamic";
import mousetrap from "mousetrap";
import { useCallback, useEffect, useState } from "react";

const TEMPLATES: Record<
  string,
  { title: string; icon: IconName; content: string; pos: number }
> = {
  table: {
    title: "Вставить таблицу",
    icon: "table-2",
    content: "\n||||\n|---|---|---|\n||||\n",
    pos: 2
  },
  codeblock: {
    title: "Вставить блок кода",
    icon: "code",
    content: "\n```\n```\n",
    pos: 4
  },
  callout: {
    title: "Вставить инфоблок",
    icon: "message-square-quote",
    content: '\n{% callout type="info" %}\n\n{% /callout %}\n',
    pos: 27
  }
};

const formattingOptions: Record<
  string,
  {
    title: string;
    keybind: string;
    keybindMac: string;
    mousetrap: string;
    format: string;
  }
> = {
  bold: {
    title: "Жирный",
    keybind: "Ctrl+B",
    keybindMac: "⌘B",
    mousetrap: "mod+b",
    format: "**{}**"
  },
  italic: {
    title: "Курсив",
    keybind: "Ctrl+I",
    keybindMac: "⌘I",
    mousetrap: "mod+i",
    format: "*{}*"
  },
  strikethrough: {
    title: "Зачеркнутый",
    keybind: "Ctrl+Shift+S",
    keybindMac: "⌘^S",
    mousetrap: "mod+shift+s",
    format: "~~{}~~"
  },
  link: {
    title: "Ссылка",
    keybind: "Ctrl+K",
    keybindMac: "⌘K",
    mousetrap: "mod+k",
    format: "[{}]()"
  },
  inlineCode: {
    title: "Встроенный код",
    keybind: "Ctrl+K",
    keybindMac: "⌘K",
    mousetrap: "mod+k",
    format: "`{}`"
  },
  blockquote: {
    title: "Цитата",
    keybind: "Ctrl+Q",
    keybindMac: "⌘Q",
    mousetrap: "mod+q",
    format: "> {}\n"
  },
  heading1: {
    title: "Заголовок 1",
    keybind: "Ctrl+1",
    keybindMac: "⌘1",
    mousetrap: "mod+1",
    format: "# {}\n"
  },
  heading2: {
    title: "Заголовок 2",
    keybind: "Ctrl+2",
    keybindMac: "⌘2",
    mousetrap: "mod+2",
    format: "## {}\n"
  },
  heading3: {
    title: "Заголовок 3",
    keybind: "Ctrl+3",
    keybindMac: "⌘3",
    mousetrap: "mod+3",
    format: "### {}\n"
  },
  heading4: {
    title: "Заголовок 4",
    keybind: "Ctrl+4",
    keybindMac: "⌘4",
    mousetrap: "mod+4",
    format: "#### {}\n"
  },
  heading5: {
    title: "Заголовок 5",
    keybind: "Ctrl+5",
    keybindMac: "⌘5",
    mousetrap: "mod+5",
    format: "##### {}\n"
  },
  unorderedList: {
    title: "Ненумерованный список",
    keybind: "Ctrl+Shift+U",
    keybindMac: "⌘^U",
    mousetrap: "mod+shift+u",
    format: "- {}\n"
  },
  orderedList: {
    title: "Нумерованный список",
    keybind: "Ctrl+Shift+O",
    keybindMac: "⌘^O",
    mousetrap: "mod+shift+o",
    format: "1. {}\n"
  },
  taskList: {
    title: "Список задач",
    keybind: "Ctrl+Shift+T",
    keybindMac: "⌘^T",
    mousetrap: "mod+shift+t",
    format: "- [ ] {}\n"
  }
};

const wrappingSymbols = {
  "`": "``",
  "(": "()",
  "*": "**",
  "[": "[]",
  "{": "{}",
  "~": "~~",
  '"': '""',
  "'": "''"
};

export function MarkdownCommandPalette({
  enabled,
  viewRef,
  isInFocus
}: {
  enabled?: boolean;
  viewRef?: React.RefObject<EditorView | null>;
  isInFocus?: boolean;
}) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    const down = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "p" || e.key === "з")) {
        e.preventDefault();
        setOpen(true);
      }

      if (e.key === "Escape" && open) {
        e.preventDefault();
        setOpen(false);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, enabled]);

  const [isMac, setIsMac] = useState(false);
  useEffect(() => {
    setIsMac(/Mac|iPod|iPhone|iPad/.test(navigator.userAgent));
  }, []);

  const handleSelect = (
    template: (typeof TEMPLATES)[keyof typeof TEMPLATES]
  ) => {
    setOpen(false);
    if (!viewRef?.current) return;
    const view = viewRef.current;
    const pos = view.state.selection.main.head;
    view.dispatch(
      view.state.update({
        changes: { from: pos, insert: template.content },
        scrollIntoView: true
      })
    );
    setTimeout(() => {
      view.focus();
      const newPos = pos + template.pos;
      view.dispatch(
        view.state.update({
          selection: { anchor: newPos, head: newPos },
          scrollIntoView: true
        })
      );
    }, 0);
  };

  const applyFormatting = useCallback(
    (format: string) => {
      setOpen(false);
      if (!viewRef?.current) return;
      const view = viewRef.current;
      const selection = view.state.selection.main;
      const from = selection.from;
      const to = selection.to;
      const selectedText = view.state.doc.sliceString(from, to);
      const formattedText = format.replace("{}", selectedText || "");
      view.dispatch(
        view.state.update({
          changes: { from, to, insert: formattedText },
          selection: {
            anchor: from + format.indexOf("}") - 1,
            head: to + format.indexOf("}") - 1
          },
          scrollIntoView: true
        })
      );
      setTimeout(() => {
        view.focus();
      }, 0);
    },
    [viewRef]
  );

  useEffect(() => {
    if (!isInFocus && !open) return;
    Object.values(formattingOptions).forEach(option => {
      mousetrap.bind(option.mousetrap, event => {
        event.preventDefault();
        event.stopPropagation();
        applyFormatting(option.format);
      });
    });

    Object.entries(wrappingSymbols).forEach(([trigger, format]) => {
      mousetrap.bind(trigger, event => {
        if (!viewRef?.current) return;
        const view = viewRef.current;
        const selection = view.state.selection.main;
        if (selection.empty) return;
        event.preventDefault();
        event.stopPropagation();
        const from = selection.from;
        const to = selection.to;
        const selectedText = view.state.doc.sliceString(from, to);
        const wrappedText = `${format[0]}${selectedText}${format[1]}`;
        view.dispatch(
          view.state.update({
            changes: { from, to, insert: wrappedText },
            selection: {
              anchor: from + 1,
              head: to + 1
            },
            scrollIntoView: true
          })
        );
      });
    });

    mousetrap.prototype.stopCallback = () => false;

    return () => {
      Object.values(formattingOptions).forEach(option => {
        mousetrap.unbind(option.mousetrap);
      });
      Object.keys(wrappingSymbols).forEach(symbol => {
        mousetrap.unbind(symbol);
      });
    };
  }, [applyFormatting, isInFocus, open, viewRef]);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search commands..." />
      <CommandList>
        <CommandEmpty>Ничего не нашли</CommandEmpty>
        <CommandGroup heading="Templates">
          {Object.entries(TEMPLATES).map(([key, template]) => (
            <CommandItem key={key} onSelect={() => handleSelect(template)}>
              <DynamicIcon name={template.icon} />
              {template.title}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Formatting">
          {Object.entries(formattingOptions).map(([key, option]) => (
            <CommandItem
              key={key}
              onSelect={() => applyFormatting(option.format)}
            >
              <span className="flex items-center gap-2">{option.title}</span>
              <CommandShortcut>
                {isMac ? option.keybindMac : option.keybind}
              </CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
