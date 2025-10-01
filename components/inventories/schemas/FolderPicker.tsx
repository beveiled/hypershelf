"use client";

import { IconButton } from "@/components/ui/button";
import { ButtonWithKbd } from "@/components/ui/kbd-button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { FolderTree } from "@/convex/lib/integrations/vsphere";
import { cn } from "@/lib/utils";
import { useHypershelf } from "@/stores";
import { AnimatePresence, motion } from "framer-motion";
import { isEqual } from "lodash";
import { ChevronRight, Folder, FolderOpen, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useStoreWithEqualityFn } from "zustand/traditional";

type IndexedTree = {
  byId: Map<string, FolderTree>;
  parentOf: Map<string, string | null>;
  pathOf: (id: string | null) => string[];
  childrenOf: (id: string | null) => FolderTree[];
  findByPath: (path: string[]) => FolderTree | null;
};

function useIndexedTree(nodes: FolderTree[]): IndexedTree {
  const { byId, parentOf } = useMemo(() => {
    const b = new Map<string, FolderTree>();
    const p = new Map<string, string | null>();
    const walk = (list: FolderTree[], parent: string | null) => {
      for (const n of list) {
        b.set(n.id, n);
        p.set(n.id, parent);
        if (n.children?.length) walk(n.children, n.id);
      }
    };
    walk(nodes, null);
    return { byId: b, parentOf: p };
  }, [nodes]);

  const pathOf = useCallback(
    (id: string | null) => {
      if (!id) return [];
      const path: string[] = [];
      let cur: string | null = id;
      while (cur) {
        path.unshift(cur);
        cur = parentOf.get(cur) ?? null;
      }
      return path;
    },
    [parentOf],
  );

  const childrenOf = useCallback(
    (id: string | null) => {
      if (!id) return nodes;
      const n = byId.get(id);
      return n?.children ?? [];
    },
    [byId, nodes],
  );

  const findByPath = useCallback(
    (path: string[]) => {
      if (!path.length) return null;
      return byId.get(path[path.length - 1]) ?? null;
    },
    [byId],
  );

  return { byId, parentOf, pathOf, childrenOf, findByPath };
}

function useRovingIndex(length: number) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    setIndex(i => (length === 0 ? 0 : Math.max(0, Math.min(i, length - 1))));
  }, [length]);
  const move = useCallback(
    (delta: number) => {
      if (length === 0) return;
      setIndex(i => (i + delta + length) % length);
      setTimeout(() => {
        const el = document.getElementById(
          `folder-picker-item-${(index + delta + length) % length}`,
        );
        if (el) el.scrollIntoView({ block: "nearest", behavior: "smooth" });
        else console.warn("No element to scroll into view");
      }, 0);
    },
    [length, index],
  );
  const set = useCallback(
    (i: number) => setIndex(Math.max(0, Math.min(i, Math.max(0, length - 1)))),
    [length],
  );
  return { index, move, set };
}

export function FolderPicker() {
  const rootMoid = useHypershelf(s => s.rootMoid);
  const setRootMoid = useHypershelf(s => s.setRootMoid);
  const folderTree = useStoreWithEqualityFn(
    useHypershelf,
    s => s.folderTree?.children ?? [],
    isEqual,
  );
  const [isPopoverOpen, setPopoverOpenInternal] = useState(false);
  const [path, setPath] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [dir, setDir] = useState(1);
  const searchRef = useRef<HTMLInputElement | null>(null);

  const tree = useIndexedTree(folderTree);
  const currentId = path[path.length - 1] ?? null;

  const setPopoverOpen = useCallback(
    (open: boolean) => {
      setPopoverOpenInternal(open);
      if (!open) {
        setPath([]);
        setQuery("");
      } else if (rootMoid) {
        const node = tree.byId.get(rootMoid);
        if (node) setPath(tree.pathOf(node.id));
      }
    },
    [rootMoid, setPath, tree],
  );

  const list = useMemo(() => {
    if (!query.trim()) {
      return tree.childrenOf(currentId);
    }
    const q = query.trim().toLowerCase();
    const allFolders = Array.from(tree.byId.values());
    const scored = allFolders
      .map(n => {
        const name = n.name.toLowerCase();
        const starts = name.startsWith(q) ? 2 : 0;
        const incl = name.includes(q) ? 1 : 0;
        return { n, s: starts + incl };
      })
      .filter(x => x.s > 0)
      .sort((a, b) => b.s - a.s || a.n.name.localeCompare(b.n.name))
      .map(x => x.n);
    return scored;
  }, [tree, currentId, query]);

  const crumbs = useMemo(() => {
    const nodes = path.map(id => tree.byId.get(id)).filter(Boolean);
    return [
      { id: "", name: "All" },
      ...nodes.map(n => ({ id: n?.id, name: n?.name })),
    ];
  }, [path, tree.byId]);

  const { index, move, set } = useRovingIndex(list.length);

  useEffect(() => {
    if (!isPopoverOpen) return;
    const t = setTimeout(() => searchRef.current?.focus(), 0);
    return () => clearTimeout(t);
  }, [isPopoverOpen, path]);

  const drill = useCallback(
    (id: string) => {
      setDir(1);
      setPath(p => [...p, id]);
      setQuery("");
      set(0);
    },
    [set],
  );

  const goUp = useCallback(() => {
    if (!path.length) return;
    setDir(-1);
    setPath(p => p.slice(0, -1));
    setQuery("");
    set(0);
  }, [path.length, set]);

  const pick = useCallback(
    (id: string) => {
      setRootMoid(id);
      setPopoverOpen(false);
    },
    [setRootMoid, setPopoverOpen],
  );

  const handleKey = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        move(1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        move(-1);
      } else if (e.key === "ArrowRight") {
        const item = list[index];
        if (item?.children?.length) {
          e.preventDefault();
          drill(item.id);
        }
      } else if (e.key === "ArrowLeft") {
        if (path.length) {
          e.preventDefault();
          goUp();
        }
      } else if (e.key === "Enter") {
        const item = list[index];
        if (!item) return;
        else pick(item.id);
      } else if (e.key === "Escape") {
        setPopoverOpen(false);
      } else if (e.key === "Backspace" && query.length === 0 && path.length) {
        goUp();
      }
    },
    [
      list,
      index,
      move,
      drill,
      pick,
      path.length,
      query.length,
      goUp,
      setPopoverOpen,
    ],
  );

  return (
    <div className="flex">
      <Popover open={isPopoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <div className="flex">
            <IconButton selected={isPopoverOpen} onClick={() => {}}>
              <Folder
                className={cn("size-4", isPopoverOpen && "text-[#f60]")}
              />
            </IconButton>
          </div>
        </PopoverTrigger>
        <PopoverContent
          side="bottom"
          align="end"
          className="w-md p-0 overflow-hidden rounded-xl"
        >
          <div className="flex flex-col">
            <div className="flex items-center gap-2 p-2 border-b">
              <div className="flex-1 relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-4 opacity-60" />
                <input
                  ref={searchRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Search or navigate…"
                  className="w-full pl-8 pr-3 py-1.5 text-sm bg-transparent outline-none"
                />
              </div>
            </div>
            <div className="px-3 pt-2 flex items-center gap-1 flex-wrap">
              {query ? (
                <div className="text-xs opacity-70">Search results</div>
              ) : (
                crumbs.map((c, i) => {
                  const isLast = i === crumbs.length - 1;
                  return (
                    <div
                      key={c.id || "root"}
                      className="flex items-center gap-1"
                    >
                      <button
                        className={cn(
                          "text-xs rounded-md px-2 py-1 transition-colors",
                          isLast
                            ? "bg-primary/10 text-primary"
                            : "hover:bg-muted",
                        )}
                        onClick={() => {
                          if (i === 0) setPath([]);
                          else setPath(path.slice(0, i));
                          setQuery("");
                          set(0);
                        }}
                      >
                        {c.name}
                      </button>
                      {i < crumbs.length - 1 && (
                        <ChevronRight className="size-3.5 opacity-60" />
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="relative" onKeyDown={handleKey}>
              <AnimatePresence custom={dir} mode="popLayout">
                <ul
                  key={path.join("/") + "|" + query}
                  className="max-h-72 overflow-auto py-1"
                  role="listbox"
                  aria-label="Folders"
                >
                  {list.length === 0 && (
                    <li className="px-3 py-8 text-center text-sm opacity-60">
                      No results
                    </li>
                  )}
                  <AnimatePresence>
                    {list.map((n, i) => {
                      const active = i === index;
                      const hasKids = n.children?.length > 0;
                      return (
                        <motion.li
                          key={n.id}
                          id={`folder-picker-item-${i}`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className={cn(
                            "origin-[0%_50%]",
                            active && "bg-accent",
                          )}
                          role="option"
                          aria-selected={active}
                          layout
                          layoutId={n.id}
                        >
                          <button
                            role="option"
                            aria-selected={active}
                            onClick={() => set(i)}
                            onDoubleClick={() =>
                              hasKids ? drill(n.id) : pick(n.id)
                            }
                            className={cn(
                              "w-full flex items-center justify-between gap-2 px-3 py-2 text-sm transition-colors",
                              active ? "bg-muted" : "hover:bg-muted/70",
                            )}
                            onFocusCapture={() => set(i)}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {hasKids ? (
                                <FolderOpen className="size-4" />
                              ) : (
                                <Folder className="size-4" />
                              )}
                              <span className="truncate">
                                {query
                                  ? tree.pathOf(n.id).map((id, idx) => {
                                      const node = tree.byId.get(id);
                                      if (!node) return null;
                                      return (
                                        <span key={id}>
                                          {idx > 0 && (
                                            <span className="opacity-60">
                                              {" "}
                                              /{" "}
                                            </span>
                                          )}
                                          <span
                                            className={
                                              idx ===
                                              tree.pathOf(n.id).length - 1
                                                ? "font-medium"
                                                : "opacity-70"
                                            }
                                          >
                                            {node.name}
                                          </span>
                                        </span>
                                      );
                                    })
                                  : n.name}
                              </span>
                            </div>
                            {hasKids && (
                              <ChevronRight className="size-4 opacity-60" />
                            )}
                          </button>
                        </motion.li>
                      );
                    })}
                  </AnimatePresence>
                </ul>
              </AnimatePresence>
              <div className="flex items-center justify-end pb-2 pr-2 gap-1.5">
                {path.length > 0 && (
                  <ButtonWithKbd
                    onClick={goUp}
                    className="text-xs h-auto py-0.5 pr-0.5"
                    variant="outline"
                    size="sm"
                    keys={["ArrowLeft"]}
                  >
                    Go back
                  </ButtonWithKbd>
                )}
                <ButtonWithKbd
                  onClick={() => {
                    const item = list[index];
                    if (item?.children?.length) drill(item.id);
                  }}
                  disabled={list[index]?.children?.length === 0}
                  className="text-xs h-auto py-0.5 pr-0.5"
                  variant="outline"
                  size="sm"
                  keys={["ArrowRight"]}
                >
                  Go inside
                </ButtonWithKbd>
              </div>
            </div>

            <div className="flex items-center justify-end p-2 border-t">
              <ButtonWithKbd
                disabled={!list[index]?.name}
                onClick={() => list[index]?.id && pick(list[index].id)}
                variant="outline"
                size="sm"
                keys={["Enter"]}
                className="text-xs h-auto py-0.5 pr-0.5"
              >
                Choose{" "}
                <span className="font-bold">
                  {list[index]?.name ?? "this folder"}
                </span>
              </ButtonWithKbd>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
