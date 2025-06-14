"use client";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { TagInput } from "@/components/ui/tag-input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { FieldType } from "@/convex/fields";
import { AssetType, UserType, ValueType } from "@/convex/schema";
import { cn } from "@/lib/utils";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState
} from "@tanstack/react-table";
import { useMutation, useQuery } from "convex/react";
import {
  ArrowDown,
  ArrowUpDown,
  ChevronDown,
  CircleCheck,
  CirclePlus,
  Loader2Icon,
  MoreHorizontal,
  Pencil
} from "lucide-react";
import { useState } from "react";

function buildColumns(
  fields: FieldType[],
  startEditing: (asset: AssetType) => void,
  viewer: Id<"users"> | null = null
): ColumnDef<{ asset: AssetType; editingBy: UserType | null }>[] {
  const columns: ColumnDef<{ asset: AssetType; editingBy: UserType | null }>[] =
    [
      {
        id: "edit",
        header: "",
        cell: ({ row }) =>
          row.original.asset.editing &&
          row.original.editingBy?._id !== viewer ? (
            <div className="bg-brand text-background absolute top-0 left-0 rounded-sm px-2 py-0 text-[0.6rem]">
              <span className="font-semibold">
                {row.original.editingBy?.email || "Unknown"}
              </span>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => startEditing(row.original.asset)}
              className="size-7"
            >
              <Pencil className="size-4" />
            </Button>
          ),
        enableSorting: false,
        enableHiding: false
      },
      {
        id: "createdAt",
        accessorFn: ({ asset }) => asset.createdAt,
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting()}
          >
            Created At
            {column.getIsSorted() ? (
              <ArrowDown
                className={cn(
                  "ml-2 h-4 w-4 transition-transform duration-200 ease-in-out",
                  column.getIsSorted() === "desc" ? "rotate-180" : ""
                )}
              />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
            )}
          </Button>
        ),
        cell: ({ row }) => {
          const v = row.getValue("createdAt") as number | undefined;
          return v ? new Date(v).toLocaleString() : "-";
        },
        sortingFn: "basic"
      },
      {
        id: "updatedAt",
        accessorFn: ({ asset }) => asset.updatedAt,
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting()}
          >
            Updated At
            {column.getIsSorted() ? (
              <ArrowDown
                className={cn(
                  "ml-2 h-4 w-4 transition-transform duration-200 ease-in-out",
                  column.getIsSorted() === "desc" ? "rotate-180" : ""
                )}
              />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
            )}
          </Button>
        ),
        cell: ({ row }) => {
          const v = row.getValue("updatedAt") as number | undefined;
          return v ? new Date(v).toLocaleString() : "-";
        },
        sortingFn: "basic"
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                View details ({row.original.asset._id})
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      }
    ];

  const dynamicCols = fields.map(f => {
    const isHidden = f.extra?.hideFromSearch === true;
    return {
      id: f.slug,
      accessorFn: ({ asset }) => asset.metadata?.[f._id] ?? null,
      header: ({ column }) =>
        typeof f.name === "string" ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting()}
            className={
              !column.getCanSort() ? "cursor-default !bg-transparent" : ""
            }
          >
            {f.name}
            {column.getCanSort() &&
              (column.getIsSorted() ? (
                <ArrowDown
                  className={cn(
                    "ml-2 h-4 w-4 transition-transform duration-200 ease-in-out",
                    column.getIsSorted() === "desc" ? "rotate-180" : ""
                  )}
                />
              ) : (
                <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
              ))}
          </Button>
        ) : (
          f.slug
        ),
      cell: ({ row }) => {
        const val = row.getValue(f.slug);
        if (f.type === "boolean")
          return val ? (
            <CircleCheck className="size-5 text-green-500" />
          ) : (
            <CirclePlus className="size-5 rotate-45 text-red-500" />
          );
        if (val == null || val === "") return "-";
        if (Array.isArray(val)) return val.join(", ");
        return String(val);
      },
      enableHiding: !isHidden,
      enableSorting: ["string", "number", "boolean", "select"].includes(f.type),
      sortingFn: ["number", "boolean"].includes(f.type) ? "basic" : undefined
    } satisfies ColumnDef<{ asset: AssetType; editingBy: UserType | null }>;
  });

  columns.splice(1, 0, ...dynamicCols);
  return columns;
}

export function AssetsInventory() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");
  const { viewer, assets } = useQuery(api.assets.getAll) ?? {};
  const { fields } = useQuery(api.fields.getAll) ?? {};
  const [editingAsset, setEditingAsset] = useState<AssetType | null>(null);
  const [editedValues, setEditedValues] = useState<Record<string, ValueType>>(
    {}
  );
  const [assetEditErrors, setAssetEditErrors] = useState<
    Record<string, string>
  >({});
  const [isLoading, setIsLoading] = useState(false);
  const updateAsset = useMutation(api.assets.updateAsset);
  const acquireLock = useMutation(api.assets.acquireLock);
  const releaseLock = useMutation(api.assets.releaseLock);

  const startEditing = (asset: AssetType) => {
    if (editingAsset) {
      releaseLock({ assetId: editingAsset._id }).catch(console.error);
    }
    acquireLock({ assetId: asset._id }).catch(console.error);
    setEditingAsset(asset);
    setEditedValues(
      fields?.reduce<Record<string, ValueType>>((acc, { field }) => {
        acc[field._id] = asset?.metadata
          ? asset?.metadata[field._id]
          : undefined;
        return acc;
      }, {}) ?? {}
    );
  };

  // TODO: client-side validation
  const handleFieldChange = (fieldId: string, value: ValueType) =>
    setEditedValues(prev => ({ ...prev, [fieldId]: value }));

  const handleSave = async () => {
    if (!editingAsset) {
      console.error("No asset is being edited");
      return;
    }
    setIsLoading(true);
    try {
      console.log(
        "Saving asset:",
        editingAsset._id,
        "with values:",
        editedValues
      );
      let res;
      try {
        res = await updateAsset({
          assetId: editingAsset._id,
          values: editedValues
        });
      } catch (error) {
        console.error("Failed to update asset:", error);
        setAssetEditErrors({ _: "Failed to update asset" });
        return;
      }
      console.log("Update asset response:", res);
      if (res.success) {
        setEditingAsset(null);
        setEditedValues({});
        setAssetEditErrors({});
      } else {
        setAssetEditErrors(res?.errors || { _: "Unknown error" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const table = useReactTable<{ asset: AssetType; editingBy: UserType | null }>(
    {
      data: assets ?? [],
      columns: buildColumns(
        fields?.map(field => field.field) ?? [],
        startEditing,
        viewer
      ),
      onSortingChange: setSorting,
      getCoreRowModel: getCoreRowModel(),
      getPaginationRowModel: getPaginationRowModel(),
      getSortedRowModel: getSortedRowModel(),
      getFilteredRowModel: getFilteredRowModel(),
      onColumnVisibilityChange: setColumnVisibility,
      onRowSelectionChange: setRowSelection,
      state: {
        sorting,
        columnVisibility,
        rowSelection,
        globalFilter
      }
    }
  );

  if (viewer === undefined || assets === undefined) {
    // TODO: replace with skeleton
    return (
      <div className="mx-auto">
        <p>loading...</p>
      </div>
    );
  }

  return (
    <>
      <div className="w-full">
        <div className="flex items-center py-4">
          <Input
            placeholder="Search assets..."
            value={globalFilter}
            onChange={event => setGlobalFilter(event.target.value)}
            className="max-w-sm"
            autoComplete="off"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                Columns <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter(column => column.getCanHide())
                .map(column => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={value => column.toggleVisibility(!!value)}
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map(headerGroup => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <TableHead key={header.id}>
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
                    className={cn({
                      "inset-ring-brand relative rounded-md inset-ring-2":
                        row.original.asset.editing &&
                        row.original.editingBy?._id !== viewer
                    })}
                  >
                    {row.getVisibleCells().map(cell => (
                      <TableCell key={cell.id}>
                        <div className="flex items-center justify-center">
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
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <AlertDialog open={!!editingAsset}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Edit Asset</AlertDialogTitle>
          </AlertDialogHeader>

          <div className="grid gap-4 py-4">
            {fields?.map(({ field }) => {
              const fieldId = field._id;
              const value = editedValues[fieldId];
              const label =
                typeof field.name === "string" ? field.name : fieldId;

              let input;
              if (field.type === "boolean") {
                input = (
                  <Checkbox
                    id={fieldId}
                    checked={!!value}
                    onCheckedChange={v => handleFieldChange(fieldId, v)}
                    aria-invalid={!!assetEditErrors[fieldId]}
                  />
                );
              } else if (field.type === "select") {
                input = (
                  <Select
                    value={value as string}
                    onValueChange={v => handleFieldChange(fieldId, v)}
                  >
                    <SelectTrigger>
                      <span
                        className={cn("col-span-3", {
                          "border-destructive": !!assetEditErrors[fieldId]
                        })}
                      >
                        {value ? String(value) : "Select an option"}
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      {field.extra?.options?.map(option => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                );
              } else if (field.type === "array") {
                input = (
                  <TagInput
                    tags={Array.isArray(value) ? value : []}
                    setTags={t => handleFieldChange(fieldId, t)}
                    placeholder={field.extra?.placeholder || "Add items..."}
                    className={cn("col-span-3", {
                      "border-destructive": !!assetEditErrors[fieldId]
                    })}
                    draggable={true}
                    validateTag={(tag: string) => {
                      if (field.extra?.listObjectType) {
                        if (
                          field.extra.listObjectType === "number" &&
                          isNaN(Number(tag))
                        ) {
                          return false;
                        }
                      }
                      if (
                        field.extra?.listObjectType === "string" &&
                        field.extra?.listObjectExtra?.regex
                      ) {
                        const regex = new RegExp(
                          field.extra.listObjectExtra.regex
                        );
                        return regex.test(tag);
                      }
                      if (
                        field.extra?.listObjectType === "string" &&
                        field.extra?.listObjectExtra?.minLength &&
                        tag.length < field.extra.listObjectExtra.minLength
                      ) {
                        return false;
                      }
                      if (
                        field.extra?.listObjectType === "string" &&
                        field.extra?.listObjectExtra?.maxLength &&
                        tag.length > field.extra.listObjectExtra.maxLength
                      ) {
                        return false;
                      }
                      if (
                        field.extra?.listObjectType === "number" &&
                        field.extra?.listObjectExtra?.minValue !== undefined &&
                        Number(tag) < field.extra.listObjectExtra.minValue
                      ) {
                        return false;
                      }
                      if (
                        field.extra?.listObjectType === "number" &&
                        field.extra?.listObjectExtra?.maxValue !== undefined &&
                        Number(tag) > field.extra.listObjectExtra.maxValue
                      ) {
                        return false;
                      }
                      return true;

                      // TODO: review validation logic
                    }}
                  />
                );
              } else {
                input = (
                  <Input
                    id={fieldId}
                    type={field.type === "number" ? "number" : "text"}
                    className={cn("col-span-3", {
                      "border-destructive": !!assetEditErrors[fieldId]
                    })}
                    value={String(value ?? "")}
                    onChange={e =>
                      handleFieldChange(
                        fieldId,
                        field.type === "number"
                          ? Number(e.target.value)
                          : e.target.value
                      )
                    }
                    aria-invalid={!!assetEditErrors[fieldId]}
                  />
                );
              }

              return (
                <div
                  key={fieldId}
                  className="grid grid-cols-4 items-center gap-4"
                >
                  <Label htmlFor={fieldId} className="text-right">
                    {label}
                  </Label>
                  <TooltipProvider>
                    <Tooltip open={!!assetEditErrors[field._id]}>
                      <TooltipTrigger asChild>{input}</TooltipTrigger>
                      <TooltipContent side="right">
                        {assetEditErrors[field._id]}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              );
            })}
          </div>

          {assetEditErrors && assetEditErrors._ && (
            <div className="text-sm text-red-500">{assetEditErrors._}</div>
          )}

          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditingAsset(null);
                setEditedValues({});
                setAssetEditErrors({});
                if (editingAsset?._id)
                  releaseLock({ assetId: editingAsset?._id }).catch(
                    console.error
                  );
              }}
              size="sm"
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isLoading} size="sm">
              {isLoading && <Loader2Icon className="animate-spin" />}
              Save
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
