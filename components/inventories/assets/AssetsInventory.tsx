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

import { MarkdownEditorPopup } from "@/components/markdown-editor/markdown-popup";
import { useQueryPredicate } from "@/components/query-builder";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { GlobalKeySequenceListener } from "@/components/util/GlobalKeySequenceListener";
import { useHeaderContent } from "@/components/util/HeaderContext";
import { useLog } from "@/components/util/Log";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { FieldType } from "@/convex/fields";
import { AssetType, UserType, ValueType } from "@/convex/schema";
import { validateFields } from "@/convex/utils";
import { cn } from "@/lib/utils";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable
} from "@tanstack/react-table";
import { useMutation, useQuery } from "convex/react";
import { FunctionReturnType, WithoutSystemFields } from "convex/server";
import { format } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDown,
  ArrowUpDown,
  ChevronDownIcon,
  CircleCheck,
  CirclePlus,
  Download,
  Eye,
  Loader2,
  MoreHorizontal,
  Pencil,
  Search,
  TriangleAlert
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Debugger } from "../Debugger";
import { useLock } from "../useLock";
import { AssetForm } from "./AssetForm";
import { TableSkeleton } from "./TableSkeleton";
import { ViewSwitcher } from "./ViewSwitcher";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectValue
} from "@/components/ui/select";
import * as SelectPrimitive from "@radix-ui/react-select";

function Unset({ required }: { required?: boolean }) {
  return (
    <div
      className={cn(
        "select-none",
        !required && "text-muted-foreground/50 italic"
      )}
    >
      unset
    </div>
  );
}

function InlineSelector({
  assetId,
  fieldId,
  value,
  options,
  disabled
}: {
  assetId: Id<"assets">;
  fieldId: Id<"fields">;
  value?: string;
  options: string[];
  disabled?: boolean;
}) {
  const updateAsset = useMutation(api.assets.update);
  const [updating, setUpdating] = useState(false);

  return (
    <Select
      value={value}
      onValueChange={value => {
        setUpdating(true);
        setTimeout(() => {
          updateAsset({
            assetId,
            values: {
              [fieldId]: value
            }
          }).then(() => setUpdating(false));
        }, 0);
      }}
      disabled={disabled}
    >
      <SelectPrimitive.Trigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="h-auto w-full py-1"
          disabled={disabled || updating}
        >
          {value && options.includes(value) ? (
            <SelectValue placeholder="Select option" />
          ) : (
            value
          )}
          {updating ? (
            <Loader2 className="size-4 animate-spin opacity-30" />
          ) : (
            <ChevronDownIcon className="size-4 opacity-30" />
          )}
        </Button>
      </SelectPrimitive.Trigger>
      <SelectContent>
        {options.map(option => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function InlineCheckmark({
  assetId,
  fieldId,
  value,
  disabled
}: {
  assetId: Id<"assets">;
  fieldId: Id<"fields">;
  value?: boolean;
  disabled?: boolean;
}) {
  const updateAsset = useMutation(api.assets.update);
  const [updating, setUpdating] = useState(false);

  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-7 !bg-transparent"
      disabled={disabled || updating}
      onClick={() => {
        setUpdating(true);
        setTimeout(() => {
          updateAsset({
            assetId,
            values: {
              [fieldId]: !value
            }
          }).then(() => setUpdating(false));
        }, 0);
      }}
    >
      {updating ? (
        <Loader2 className="size-5 animate-spin" />
      ) : value ? (
        <CircleCheck className="size-5 text-green-500" />
      ) : (
        <CirclePlus className="size-5 rotate-45 text-red-500" />
      )}
    </Button>
  );
}

export function renderField(
  assetId: Id<"assets">,
  fieldId: Id<"fields">,
  field: WithoutSystemFields<Omit<FieldType, "slug">>,
  value: ValueType,
  users: FunctionReturnType<typeof api.users.get>["users"],
  setMarkdownPreview: (content: string | null) => void,
  noInlineEdits?: boolean
) {
  if (field.type === "boolean")
    return (
      <InlineCheckmark
        assetId={assetId}
        fieldId={fieldId}
        value={value as boolean}
        disabled={!!field.editingBy || noInlineEdits}
      />
    );

  if (field.type === "user" && value) {
    const user = users.find(u => u.id === value);
    return user?.email;
  }

  if (field.type === "date" && value) {
    return format(new Date(value as string), "PPP");
  }

  if (field.type === "markdown" && value) {
    // TODO: Download markdown field contents (.pdf)
    // TODO: Copy pdf link
    return (
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMarkdownPreview(value as string)}
        >
          <Eye className="size-4" />
        </Button>
        <Button variant="ghost" size="sm">
          <Download className="size-4" />
        </Button>
      </div>
    );
  }

  if (field.type === "select" && Array.isArray(field.extra?.options)) {
    return (
      <InlineSelector
        assetId={assetId}
        fieldId={fieldId}
        value={value as string}
        options={field.extra.options}
        disabled={!!field.editingBy || noInlineEdits}
      />
    );
  }

  if (
    value == null ||
    value === "" ||
    (Array.isArray(value) && value.length === 0)
  )
    return <Unset required={field.required} />;

  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

export function AssetsInventory() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [editingAsset, setEditingAsset] = useState<AssetType | null>(null);
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [isDebug, setIsDebug] = useState(false);
  const [markdownPreview, setMarkdownPreview] = useState<string | null>(null);
  const [activeViewId, setActiveViewId] = useState<Id<"views"> | null>(null);

  const headerRef = useRef<HTMLTableRowElement>(null);

  const ingestLogs = useLog();
  const { viewer } = useQuery(api.users.me) ?? {};
  const { assets } = useQuery(api.assets.get) ?? {};
  const { fields } = useQuery(api.fields.get) ?? {};
  const { users } = useQuery(api.users.get) ?? {};
  const { views } = useQuery(api.views.get, {}) ?? {};

  const activeView = useMemo(() => {
    if (!views || !activeViewId) return null;
    return views.find(v => v._id === activeViewId) || null;
  }, [views, activeViewId]);

  const columnOrder = useMemo(() => {
    if (!activeView || !fields) return [];
    return [
      "edit",
      ...activeView.fields.map(
        f => fields.find(ff => ff.field._id === f)!.field.slug
      ),
      "actions"
    ];
  }, [activeView, fields]);

  const columnVisibility = useMemo(() => {
    if (!activeView || !fields) return {};
    return Object.fromEntries([
      ...fields.map(f => [
        f.field.slug,
        activeView.fields.includes(f.field._id)
      ]),
      ["edit", true],
      ["actions", true]
    ]);
  }, [activeView, fields]);

  useEffect(() => {
    if (!activeView || !fields) return;
    setSorting(prev =>
      prev.length > 0
        ? prev
        : (activeView.sortBy?.map(s => ({
            id: fields.find(f => f.field._id === s.fieldId)?.field.slug || "",
            desc: s.direction === "desc"
          })) ?? [])
    );
  }, [activeView, fields]);

  const filters = useMemo(() => {
    if (!activeView || !fields) return undefined;
    if (!activeView.enableFiltering) return undefined;
    return activeView.filters || undefined;
  }, [activeView, fields]);

  useEffect(() => {
    if (activeViewId || !views) return;
    const preferredView = localStorage.getItem("activeViewId");
    let view;
    if (preferredView) {
      view = views.find(v => v._id === preferredView);
    }
    view ??= views[0];
    if (!view) return;

    setActiveViewId(view._id);
  }, [activeViewId, fields, views]);

  const formFields = useMemo(() => fields?.map(f => f.field) ?? [], [fields]);

  const assetErrors = useMemo(() => {
    if (!assets || !fields) return {};

    const errors: Record<Id<"assets">, Record<Id<"fields">, string>> = {};
    assets.forEach(asset => {
      if (!asset.asset?.metadata) return;

      const assetErrors = validateFields(
        fields.map(f => f.field),
        asset.asset?.metadata
      );
      if (assetErrors && Object.keys(assetErrors).length > 0) {
        errors[asset.asset._id] = assetErrors;
      }
    });
    return errors;
  }, [assets, fields]);

  const { acquireLock, releaseLock } = useLock<Id<"assets">>(
    ingestLogs,
    30000,
    30
  );

  const startEditing = useCallback(
    (asset: AssetType) => {
      if (editingAsset) releaseLock();
      acquireLock(asset._id);
      setEditingAsset(asset);
    },
    [editingAsset, acquireLock, releaseLock]
  );

  const { setContent: setHeaderContent } = useHeaderContent();

  function buildColumns(
    fields: FieldType[],
    startEditing: (asset: AssetType) => void,
    viewer: string | null | undefined
  ): ColumnDef<{ asset: AssetType; editingBy: UserType | null }>[] {
    const columns: ColumnDef<{
      asset: AssetType;
      editingBy: UserType | null;
    }>[] = [
      {
        id: "edit",
        header: () => (
          <>
            <div className="border-border absolute top-0 right-0 bottom-0 left-0 -z-10 m-[-1px] rounded-md border bg-black/60 backdrop-blur-xl transition-all duration-150" />
            <div className="flex items-center">
              <AnimatePresence>
                {showSearchInput && (
                  <motion.div
                    key="search-input"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                    className="absolute top-full left-0 mt-1"
                  >
                    <Input
                      placeholder="Поиск хостов..."
                      value={globalFilter}
                      onChange={event => setGlobalFilter(event.target.value)}
                      onBlur={() => !globalFilter && setShowSearchInput(false)}
                      onKeyUp={event => {
                        if (
                          (event.key === "Enter" || event.key === "Escape") &&
                          !globalFilter
                        ) {
                          event.preventDefault();
                          setShowSearchInput(false);
                        }
                      }}
                      className="!border-border !h-8 max-w-sm !bg-black/60 !ring-0 backdrop-blur-2xl"
                      autoComplete="off"
                      autoFocus={true}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSearchInput(prev => !prev)}
                className="size-5"
              >
                <Search className="size-4" />
              </Button>
            </div>
          </>
        ),
        cell: ({ row }) => (
          <>
            {Object.keys(assetErrors).includes(row.original.asset._id) && (
              <TriangleAlert className="absolute top-0.5 left-0.5 size-2.5 text-red-500" />
            )}
            {row.original.asset.editing && (
              <div className="bg-brand text-background absolute top-0 left-0 rounded-sm px-2 py-0 text-[0.6rem]">
                <span className="font-semibold">
                  {row.original.editingBy?.email || "Незвестный юзер"}
                </span>
              </div>
            )}
            {(!row.original.asset.editing ||
              row.original.editingBy?._id === viewer) && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => startEditing(row.original.asset)}
                className="size-7"
              >
                <Pencil className="size-4" />
              </Button>
            )}
          </>
        ),
        enableSorting: false,
        enableHiding: false
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="size-7 p-0">
                <span className="sr-only">Открыть меню</span>
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Действия</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                Показать детали ({row.original.asset._id})
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      }
    ];

    const dynamicCols = fields
      .filter(f => !f.hidden)
      .map(f => {
        const isHidden = f.extra?.hideFromSearch === true;
        return {
          id: f.slug,
          accessorFn: ({ asset }) => asset.metadata?.[f._id] ?? null,
          header: ({ column }) =>
            typeof f.name === "string" ? (
              <div className="flex items-center gap-1">
                {f.name}
                {column.getCanSort() && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => column.toggleSorting()}
                    className={cn(
                      "!size-auto !p-1",
                      !column.getCanSort()
                        ? "cursor-default !bg-transparent"
                        : ""
                    )}
                  >
                    {column.getIsSorted() ? (
                      <ArrowDown
                        className={cn(
                          "size-4 transition-transform duration-200 ease-in-out",
                          column.getIsSorted() === "desc" ? "rotate-180" : ""
                        )}
                      />
                    ) : (
                      <ArrowUpDown className="size-4 opacity-50" />
                    )}
                  </Button>
                )}
              </div>
            ) : (
              f.slug
            ),
          cell: ({ row }) => {
            const val = row.getValue(f.slug) as ValueType | undefined;
            const fieldError = assetErrors[row.original.asset._id]?.[f._id];
            if (fieldError) {
              return (
                <Tooltip>
                  <TooltipTrigger>
                    <div className="rounded-md bg-red-500/30 px-2 py-1">
                      {renderField(
                        row.original.asset._id,
                        f._id,
                        f,
                        val,
                        users ?? [],
                        setMarkdownPreview
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>{fieldError}</TooltipContent>
                </Tooltip>
              );
            } else {
              return renderField(
                row.original.asset._id,
                f._id,
                f,
                val,
                users ?? [],
                setMarkdownPreview
              );
            }
          },
          enableHiding: !isHidden,
          enableSorting: ["string", "number", "boolean", "select"].includes(
            f.type
          )
        } satisfies ColumnDef<{ asset: AssetType; editingBy: UserType | null }>;
      });

    columns.splice(1, 0, ...dynamicCols);
    return columns;
  }

  const predicate = useQueryPredicate(filters);
  const table = useReactTable<{ asset: AssetType; editingBy: UserType | null }>(
    {
      data: assets ?? [],
      columns: buildColumns(formFields, startEditing, viewer),
      onSortingChange: setSorting,
      getCoreRowModel: getCoreRowModel(),
      getPaginationRowModel: getPaginationRowModel(),
      getSortedRowModel: getSortedRowModel(),
      getFilteredRowModel: getFilteredRowModel(),
      onRowSelectionChange: setRowSelection,
      globalFilterFn: row => predicate(row.original),
      manualPagination: true,
      enableMultiSort: true,
      state: {
        sorting,
        columnVisibility,
        rowSelection,
        globalFilter: filters,
        columnOrder
      }
    }
  );

  useEffect(() => {
    setHeaderContent(
      <ViewSwitcher
        activeViewId={activeViewId}
        setActiveViewId={setActiveViewId}
        views={views ?? []}
      />
    );
    return () => setHeaderContent(null);
  }, [setHeaderContent, activeViewId, views]);

  if (viewer === undefined || assets === undefined) {
    return <TableSkeleton />;
  }

  return (
    <>
      <div>
        <div className="h-[calc(100dvh-3.5rem)] overflow-scroll rounded-md border">
          <Table className="table-auto">
            <TableHeader>
              {table.getHeaderGroups().map(headerGroup => (
                <TableRow
                  key={headerGroup.id}
                  className="sticky top-0 z-40 h-8"
                  ref={headerRef}
                >
                  {headerGroup.headers.map(header => (
                    <TableHead key={header.id} className="!h-auto">
                      <div className="flex items-center justify-center">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map(row => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className={cn("relative", {
                      "inset-ring-brand rounded-md inset-ring-2":
                        row.original.asset.editing,
                      "bg-red-500/10 hover:!bg-red-500/20": Object.keys(
                        assetErrors
                      ).includes(row.original.asset._id)
                    })}
                  >
                    {row.getVisibleCells().map((cell, idx) => (
                      <TableCell
                        key={cell.id}
                        className={cn(
                          "px-2",
                          idx > 0 && "border-border border-l"
                        )}
                      >
                        <div className="m-auto flex w-max max-w-sm items-center justify-center break-words break-all hyphens-auto whitespace-normal">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </div>
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell className="h-24 text-center">
                    Ничего не нашлось. Попробуй изменить фильтры
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <AssetForm
        open={!!editingAsset}
        asset={editingAsset}
        fields={formFields}
        onClose={() => {
          setEditingAsset(null);
          releaseLock();
        }}
        isLockedBySomeoneElse={
          (assets.find(a => a.asset._id === editingAsset?._id)?.asset.editing &&
            (assets.find(a => a.asset._id === editingAsset?._id)?.editingBy
              ?._id ?? null) !== viewer) ||
          false
        }
      />

      {markdownPreview && (
        <MarkdownEditorPopup
          content={markdownPreview}
          onClose={() => setMarkdownPreview(null)}
          preview={true}
        />
      )}

      <Debugger
        data={editingAsset || assets}
        open={isDebug}
        setIsOpen={setIsDebug}
        rootName={editingAsset ? `Asset <${editingAsset._id}>` : "Assets"}
        defaultExpanded={!!editingAsset}
      />
      <GlobalKeySequenceListener onMatch={() => setIsDebug(true)} />
    </>
  );

  // TODO: Create new asset UI
  // TODO: Query builder
}
