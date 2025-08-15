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
"use client";

import {
  HyperQueryBuilder,
  RowData,
  useQueryPredicate
} from "@/components/query-builder";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { useHeaderContent } from "@/components/util/HeaderContext";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ValueType } from "@/convex/schema";
import { ViewType } from "@/convex/views";
import { cn } from "@/lib/utils";
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ColumnDef,
  ColumnOrderState,
  Header,
  OnChangeFn,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable
} from "@tanstack/react-table";
import { useMutation, useQuery } from "convex/react";
import { FunctionReturnType } from "convex/server";
import {
  ArrowDown,
  ArrowUpDown,
  ChevronDown,
  Eye,
  EyeOff,
  GripVertical,
  Link2,
  Loader2,
  Plus,
  Trash2
} from "lucide-react";
import {
  CSSProperties,
  Dispatch,
  SetStateAction,
  useEffect,
  useMemo,
  useState
} from "react";
import { RuleGroupType } from "react-querybuilder";
import { renderField } from "../assets/AssetsInventory";
import { Debugger } from "../Debugger";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { GlobalKeySequenceListener } from "@/components/util/GlobalKeySequenceListener";

function DraggableHeader({
  header,
  hidden,
  toggleVisibility
}: {
  header: Header<RowData, unknown>;
  hidden: boolean;
  toggleVisibility: (id: Id<"fields">) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: header.column.id });
  const style: CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition
  };

  return (
    <TableHead
      ref={setNodeRef}
      style={style}
      className={cn(
        "!h-auto transition-opacity duration-200 select-none",
        hidden && "opacity-20"
      )}
    >
      {header.isPlaceholder ? null : (
        <div className="flex items-center gap-1">
          {flexRender(header.column.columnDef.header, header.getContext())}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => toggleVisibility(header.column.id as Id<"fields">)}
            className="!size-auto !p-1"
          >
            {hidden ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => header.column.toggleSorting(undefined, true)}
            className="!size-auto !p-1"
          >
            {header.column.getIsSorted() ? (
              <ArrowDown
                className={cn(
                  "size-4 transition-transform",
                  header.column.getIsSorted() === "desc" && "rotate-180"
                )}
              />
            ) : (
              <ArrowUpDown className="size-4 opacity-50" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            {...attributes}
            {...listeners}
            className="!size-auto cursor-grab !p-1"
          >
            <GripVertical className="size-4" />
          </Button>
        </div>
      )}
    </TableHead>
  );
}

function ViewHeaderButton({
  view,
  activeViewId,
  setActiveViewId,
  setColumnOrder,
  setHiddenFields,
  setSorting,
  setFilters,
  fields,
  parentOpen,
  setParentOpen,
  setEnableQueryBuilder
}: {
  view: ViewType;
  activeViewId: Id<"views"> | null;
  setActiveViewId: (viewId: Id<"views"> | null) => void;
  setColumnOrder: (order: Id<"fields">[]) => void;
  setHiddenFields: (fields: Set<Id<"fields">>) => void;
  setSorting: (sorting: SortingState) => void;
  setFilters: Dispatch<SetStateAction<RuleGroupType | undefined>>;
  fields: FunctionReturnType<typeof api.fields.get>["fields"];
  parentOpen: boolean;
  setParentOpen: (open: boolean) => void;
  setEnableQueryBuilder: Dispatch<SetStateAction<boolean>>;
}) {
  const [openViewDeletePopover, setOpenViewDeletePopover] = useState(false);
  const deleteView = useMutation(api.views.remove);

  useEffect(() => {
    if (!parentOpen) {
      setOpenViewDeletePopover(false);
    }
  }, [parentOpen]);

  return (
    <div
      className="mb-1 flex items-center justify-between gap-1"
      key={view._id}
    >
      <Button
        variant="ghost"
        className={cn(
          "w-48 shrink-0 justify-start text-left",
          activeViewId === view._id
            ? "bg-white/10 hover:bg-white/10"
            : "hover:bg-white/5"
        )}
        onClick={() => {
          const orderedFields: Id<"fields">[] = [];
          view.fields.forEach(fieldId => {
            if (fields.find(f => f.field._id === fieldId)) {
              orderedFields.push(fieldId);
            }
          });
          fields.forEach(f => {
            if (!orderedFields.includes(f.field._id)) {
              orderedFields.push(f.field._id);
            }
          });
          setColumnOrder(orderedFields);
          if (fields) {
            setHiddenFields(
              new Set<Id<"fields">>(
                fields
                  .map(f => f.field._id)
                  .filter(id => !view.fields.includes(id))
              )
            );
          }
          setSorting(
            view.sortBy?.map(s => ({
              id: s.fieldId,
              desc: s.direction === "desc"
            })) ?? []
          );
          setEnableQueryBuilder(!!view.enableFiltering);
          setFilters(view.filters ?? undefined);
          setActiveViewId(view._id);
          setParentOpen(false);
        }}
      >
        {view.name}
      </Button>
      <Popover open={openViewDeletePopover}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpenViewDeletePopover(true)}
            className="group size-9"
          >
            <Trash2 className="size-4 transition-colors duration-200 group-hover:text-red-500" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="flex w-64 flex-col gap-4 text-center text-sm">
          <div className="font-title relative text-left text-lg font-extrabold">
            Delete View
            <div className="bg-brand absolute bottom-0.5 left-0 h-0.5 w-4" />
          </div>
          Уверен, что хочешь удалить? Это нельзя отменить
          <div className="flex gap-2">
            <Button
              variant="destructive"
              onClick={() => {
                deleteView({ viewId: view._id });
                if (activeViewId === view._id) {
                  setActiveViewId(null);
                  setColumnOrder([]);
                  setHiddenFields(new Set<Id<"fields">>());
                  setSorting([]);
                  setEnableQueryBuilder(false);
                  setFilters(undefined);
                }
                setOpenViewDeletePopover(false);
              }}
              className="flex-auto"
            >
              <Trash2 className="size-4" />
              Удалить
            </Button>
            <Button
              variant="secondary"
              onClick={() => setOpenViewDeletePopover(false)}
            >
              Отмена
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function ViewPicker({
  views,
  activeViewId,
  setActiveViewId,
  setColumnOrder,
  setHiddenFields,
  setSorting,
  setFilters,
  fields,
  setEnableQueryBuilder
}: {
  views: ViewType[];
  activeViewId: Id<"views"> | null;
  setActiveViewId: (viewId: Id<"views"> | null) => void;
  setColumnOrder: (order: Id<"fields">[]) => void;
  setHiddenFields: (fields: Set<Id<"fields">>) => void;
  setSorting: (sorting: SortingState) => void;
  setFilters: Dispatch<SetStateAction<RuleGroupType | undefined>>;
  fields: FunctionReturnType<typeof api.fields.get>["fields"];
  setEnableQueryBuilder: Dispatch<SetStateAction<boolean>>;
}) {
  const [creatingNewView, setCreatingNewView] = useState(false);
  const [newViewName, setNewViewName] = useState("");
  const [parentOpen, setParentOpen] = useState(false);

  useEffect(() => {
    if (!parentOpen) {
      setCreatingNewView(false);
      setNewViewName("");
    }
  }, [parentOpen]);

  const createView = useMutation(api.views.create);

  return (
    <DropdownMenu open={parentOpen} onOpenChange={setParentOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="!h-auto py-0 text-xs !ring-0 hover:!bg-transparent"
        >
          {views.find(v => v._id === activeViewId)?.name || "Выбрать вид"}
          <ChevronDown />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {views.map(view => (
          <ViewHeaderButton
            key={view._id}
            view={view}
            activeViewId={activeViewId}
            setActiveViewId={setActiveViewId}
            setColumnOrder={setColumnOrder}
            setHiddenFields={setHiddenFields}
            setSorting={setSorting}
            setFilters={setFilters}
            fields={fields}
            parentOpen={parentOpen}
            setParentOpen={setParentOpen}
            setEnableQueryBuilder={setEnableQueryBuilder}
          />
        ))}
        <Popover open={creatingNewView} onOpenChange={setCreatingNewView}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start text-left"
              onClick={() => setCreatingNewView(true)}
            >
              <Plus /> Создать новый
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="flex flex-col gap-4">
              <div className="font-title relative text-lg font-extrabold">
                New View
                <div className="bg-brand absolute bottom-0.5 left-0 h-0.5 w-4" />
              </div>
              <Input
                placeholder="Название"
                value={newViewName}
                onChange={e => setNewViewName(e.target.value)}
              />
              <div className="flex gap-2">
                <Button
                  disabled={!newViewName}
                  onClick={async () => {
                    const view = await createView({ name: newViewName });
                    setActiveViewId(view);
                    setCreatingNewView(false);
                    setNewViewName("");
                    setHiddenFields(new Set<Id<"fields">>());
                    setColumnOrder(
                      fields.map(f => f.field._id as Id<"fields">)
                    );
                    setSorting([]);
                    setEnableQueryBuilder(false);
                    setFilters(undefined);
                  }}
                  className="flex-auto"
                >
                  <Plus className="size-4" />
                  Создать
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setCreatingNewView(false);
                    setNewViewName("");
                  }}
                >
                  Отмена
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Debug({
  activeViewId,
  views
}: {
  activeViewId: Id<"views"> | null;
  views: ViewType[];
}) {
  const makeGlobal = useMutation(api.views.makeGlobal);
  const [isDebug, setIsDebug] = useState(false);
  const [isConfirmPublic, setIsConfirmPublic] = useState(false);
  const [publicTimeout, setPublicTimeout] = useState(0);
  const [isMakingPublic, setIsMakingPublic] = useState(false);

  useEffect(() => {
    if (publicTimeout > 0) {
      const timer = setTimeout(() => {
        setPublicTimeout(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [publicTimeout]);

  return (
    <>
      <Debugger
        data={
          (activeViewId && views.find(f => f._id === activeViewId)) || views
        }
        open={isDebug}
        setIsOpen={setIsDebug}
        rootName={
          (activeViewId &&
            `View <${views.find(f => f._id === activeViewId)?.name}>`) ||
          "Views"
        }
        defaultExpanded={
          !!(activeViewId && views.find(f => f._id === activeViewId))
        }
      >
        {activeViewId &&
          views.find(f => f._id === activeViewId) &&
          !(
            activeViewId && views.find(f => f._id === activeViewId)?.global
          ) && (
            <AlertDialog
              open={isConfirmPublic}
              onOpenChange={setIsConfirmPublic}
            >
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setPublicTimeout(10);
                  }}
                >
                  <Link2 />
                  Сделать публичным
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-2xl">
                    Make view public
                  </AlertDialogTitle>
                </AlertDialogHeader>
                <p className="text-sm">
                  Все пользователи будут видеть этот вид. Они не смогут его
                  отредактировать
                </p>
                <p className="text-destructive text-sm font-bold">
                  Это действие нельзя отменить
                </p>
                <AlertDialogFooter>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setIsMakingPublic(true);
                      makeGlobal({
                        viewId: activeViewId
                      });
                      setIsMakingPublic(false);
                      setIsConfirmPublic(false);
                    }}
                    disabled={isMakingPublic || publicTimeout > 0}
                    className={cn(publicTimeout > 0 && "cursor-not-allowed")}
                  >
                    {publicTimeout > 0 ? (
                      <span>
                        {publicTimeout}
                        &nbsp;
                      </span>
                    ) : isMakingPublic ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <Link2 />
                    )}
                    Сделать публичным
                  </Button>
                  <AlertDialogCancel asChild>
                    <Button variant="secondary">Отмена</Button>
                  </AlertDialogCancel>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
      </Debugger>
      <GlobalKeySequenceListener onMatch={() => setIsDebug(true)} />
    </>
  );
}

export function ViewsInventory() {
  const { assets } = useQuery(api.assets.get) ?? {};
  const { fields } = useQuery(api.fields.get) ?? {};
  const { users } = useQuery(api.users.get) ?? {};
  const { views } = useQuery(api.views.get, { ignoreImmutable: true }) ?? {};

  const updateView = useMutation(api.views.update);
  const deleteView = useMutation(api.views.remove);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnOrder, setColumnOrder] = useState<Id<"fields">[]>([]);
  const [filters, setFilters] = useState<RuleGroupType | undefined>(undefined);
  const [hiddenFields, setHiddenFields] = useState<Set<Id<"fields">>>(
    () => new Set()
  );
  const [activeViewId, setActiveViewId] = useState<Id<"views"> | null>(null);
  const [enableQueryBuilder, setEnableQueryBuilder] = useState(false);

  useEffect(() => {
    if (fields && !columnOrder.length)
      setColumnOrder(fields.map(f => f.field._id as Id<"fields">));
  }, [fields, columnOrder.length]);

  useEffect(() => {
    if (fields && views && !activeViewId) {
      const defaultView = views.find(v => v.fields.length === fields?.length);
      if (defaultView) {
        setActiveViewId(defaultView._id);
        setColumnOrder(() => {
          const orderedFields: Id<"fields">[] = [];
          defaultView.fields.forEach(fieldId => {
            if (fields.find(f => f.field._id === fieldId)) {
              orderedFields.push(fieldId);
            }
          });
          fields.forEach(f => {
            if (!orderedFields.includes(f.field._id)) {
              orderedFields.push(f.field._id);
            }
          });
          return orderedFields;
        });
        setHiddenFields(
          new Set<Id<"fields">>(
            fields
              .map(f => f.field._id)
              .filter(id => !defaultView.fields.includes(id))
          )
        );
        setSorting(
          defaultView.sortBy?.map(s => ({
            id: s.fieldId,
            desc: s.direction === "desc"
          })) ?? []
        );
        setEnableQueryBuilder(!!defaultView.enableFiltering);
        setFilters(defaultView.filters);
      }
    }
  }, [views, fields, activeViewId]);

  useEffect(() => {
    if (!columnOrder.length) return;
    const sortBy =
      sorting.length === 0
        ? undefined
        : sorting.map(s => ({
            fieldId: s.id as Id<"fields">,
            direction: s.desc ? "desc" : "asc"
          }));

    if (!activeViewId) return;
    const args = {
      viewId: activeViewId,
      fields: columnOrder.filter(id => !hiddenFields.has(id)),
      sortBy: sortBy as
        | { fieldId: Id<"fields">; direction: "asc" | "desc" }[]
        | undefined,
      filters: filters ?? undefined,
      enableFiltering: enableQueryBuilder
    };
    updateView(args);
  }, [
    columnOrder,
    sorting,
    hiddenFields,
    activeViewId,
    updateView,
    filters,
    enableQueryBuilder
  ]);

  const buildColumns = useMemo<ColumnDef<RowData>[]>(() => {
    if (!fields) return [];
    return fields.map(f => ({
      id: f.field._id,
      accessorFn: (row: RowData) => row.asset.metadata?.[f.field._id] ?? null,
      header: f.field.name ?? f.field._id,
      cell: ({ row }) => {
        const val = row.getValue(f.field._id) as ValueType | undefined;
        return renderField(
          row.original.asset._id,
          f.field._id,
          f.field,
          val,
          users ?? [],
          () => {},
          true
        );
      },
      enableSorting: true
    }));
  }, [fields, users]);

  const data = useMemo<RowData[]>(
    () => (assets ? assets.map(a => ({ asset: a.asset })) : []),
    [assets]
  );

  const predicate = useQueryPredicate(filters);
  const table = useReactTable<RowData>({
    data,
    columns: buildColumns,
    state: {
      sorting,
      columnOrder,
      globalFilter: enableQueryBuilder ? filters : undefined
    },
    onSortingChange: setSorting,
    onColumnOrderChange: setColumnOrder as OnChangeFn<ColumnOrderState>,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableMultiSort: true,
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: row => predicate(row.original)
  });

  const toggleVisibility = (id: Id<"fields">) => {
    setHiddenFields(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (active && over && active.id !== over.id) {
      setColumnOrder(cols => {
        const oldIdx = cols.indexOf(active.id as Id<"fields">);
        const newIdx = cols.indexOf(over.id as Id<"fields">);
        return arrayMove(cols, oldIdx, newIdx);
      });
    }
  };

  const { setContent: setHeaderContent } = useHeaderContent();

  useEffect(() => {
    if (!views || !fields) {
      setHeaderContent(null);
      return;
    }
    setHeaderContent(
      <div className="flex items-center gap-2">
        <ViewPicker
          activeViewId={activeViewId}
          setActiveViewId={setActiveViewId}
          setHiddenFields={setHiddenFields}
          setColumnOrder={setColumnOrder}
          setSorting={setSorting}
          setFilters={setFilters}
          fields={fields}
          views={views}
          setEnableQueryBuilder={setEnableQueryBuilder}
        />
      </div>
    );
    return () => setHeaderContent(null);
  }, [activeViewId, setHeaderContent, views, fields, deleteView]);

  const [isActiveViewSet, setIsActiveViewSet] = useState(false);
  useEffect(() => {
    if (activeViewId && !isActiveViewSet) {
      setIsActiveViewSet(true);
    }
  }, [activeViewId, isActiveViewSet]);

  if (assets === undefined || fields === undefined || views === undefined)
    return (
      <div className="overflow-x-scroll rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {Array.from({ length: 10 }).map((_, i) => (
                <TableHead key={i}>
                  <Skeleton className="h-4 w-26 rounded" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 30 }).map((_, r) => (
              <TableRow key={r}>
                {Array.from({ length: 10 }).map((_, c) => (
                  <TableCell key={c}>
                    <Skeleton className="h-4 w-full rounded" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );

  return (
    <>
      {isActiveViewSet && (
        <DndContext
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          sensors={sensors}
        >
          <div className="h-[calc(100dvh-3.5rem)] overflow-scroll rounded-lg border">
            {users && (
              <div className="border-border border-b p-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setEnableQueryBuilder(!enableQueryBuilder)}
                  className="mb-2"
                >
                  {enableQueryBuilder ? (
                    <>
                      <EyeOff className="size-4" />
                      Выключить фильтры
                    </>
                  ) : (
                    <>
                      <Eye className="size-4" />
                      Включить фильтры
                    </>
                  )}
                </Button>
                <div
                  className={cn(
                    !enableQueryBuilder && "pointer-events-none opacity-30"
                  )}
                >
                  <HyperQueryBuilder
                    fields={fields}
                    users={users}
                    filters={filters}
                    setFilters={setFilters}
                  />
                </div>
              </div>
            )}
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map(hg => (
                  <TableRow
                    key={hg.id}
                    className="bg-background hover:bg-background sticky top-0 z-40 h-10"
                  >
                    <SortableContext
                      items={columnOrder}
                      strategy={horizontalListSortingStrategy}
                    >
                      {hg.headers.map(h => (
                        <DraggableHeader
                          key={h.id}
                          header={h}
                          hidden={hiddenFields.has(h.column.id as Id<"fields">)}
                          toggleVisibility={toggleVisibility}
                        />
                      ))}
                    </SortableContext>
                  </TableRow>
                ))}
              </TableHeader>

              <TableBody>
                {table.getRowModel().rows.length ? (
                  table.getRowModel().rows.map(r => (
                    <TableRow key={r.id}>
                      {r.getAllCells().map(c => (
                        <TableCell
                          key={c.id}
                          className={cn(
                            "h-12 px-2 transition-opacity duration-200",
                            hiddenFields.has(c.column.id as Id<"fields">) &&
                              "opacity-20"
                          )}
                        >
                          {flexRender(c.column.columnDef.cell, c.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      className="h-24 text-center"
                      colSpan={columnOrder.length}
                    >
                      Ничего не нашлось. Попробуй изменить фильтры
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </DndContext>
      )}
      {!isActiveViewSet && (
        <div className="flex h-[calc(100dvh-3.5rem)] items-center justify-center">
          <span className="text-muted-foreground">
            Выбери или создай новый вид
          </span>
        </div>
      )}
      <Debug activeViewId={activeViewId} views={views} />
    </>
  );
}
