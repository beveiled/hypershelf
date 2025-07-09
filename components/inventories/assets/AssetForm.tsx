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

import { MarkdownEditor } from "@/components/markdown-editor";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { TagInput } from "@/components/ui/tag-input";
import { useLog } from "@/components/util/Log";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { FieldType } from "@/convex/fields";
import { AssetType, ValueType } from "@/convex/schema";
import { validateFields } from "@/convex/utils";
import { cn } from "@/lib/utils";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useMutation, useQuery } from "convex/react";
import { format } from "date-fns";
import {
  CalendarIcon,
  Check,
  ChevronsUpDown,
  Loader2Icon,
  Save,
  X
} from "lucide-react";
import { DynamicIcon, IconName } from "lucide-react/dynamic";
import { useEffect, useState } from "react";

interface AssetFormProps {
  open: boolean;
  asset: AssetType | null;
  fields: FieldType[];
  onClose: () => void;
  isLockedBySomeoneElse: boolean;
}

export function AssetForm({
  open,
  asset,
  fields,
  onClose,
  isLockedBySomeoneElse
}: AssetFormProps) {
  const ingestLogs = useLog();

  const updateAsset = useMutation(api.assets.update);
  const createAsset = useMutation(api.assets.create);
  const { users } = useQuery(api.users.get) ?? {};

  const [editedValues, setEditedValues] = useState<Record<string, ValueType>>(
    {}
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [openPopovers, setOpenPopovers] = useState<
    Record<Id<"fields">, boolean>
  >({});

  useEffect(() => {
    if (asset)
      setEditedValues(
        fields.reduce<Record<string, ValueType>>((acc, { _id, name }) => {
          const id = _id ?? (typeof name === "string" ? name : "");
          acc[id] = asset?.metadata?.[id];
          return acc;
        }, {})
      );
    setErrors({});
  }, [asset, fields]);

  useEffect(() => {
    const validationErrors = validateFields(fields, editedValues);
    if (validationErrors) setErrors(validationErrors);
    else setErrors({});
  }, [editedValues, fields]);

  const handleFieldChange = (fieldId: string, value: ValueType) => {
    setEditedValues(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      if (asset) {
        const res = await updateAsset({
          assetId: asset._id,
          values: editedValues
        });
        ingestLogs(res);
        if (res.success) {
          onClose();
        } else {
          setErrors(res.errors ?? { _: "Unknown error" });
        }
      } else {
        const res = await createAsset({ metadata: editedValues });
        ingestLogs(res);
        if (res.success) {
          onClose();
        } else {
          setErrors(res.errors ?? { _: "Unknown error" });
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  // TODO: if the field has changed, show the warning about conflict
  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="!max-w-[96vw] px-4 pt-2 pb-4 md:!max-w-[90vw] md:p-6">
        <VisuallyHidden>
          <AlertDialogDescription>
            {asset ? (
              <span>
                Editing asset <strong>{asset._id}</strong>
              </span>
            ) : (
              <span>Creating a new asset</span>
            )}
          </AlertDialogDescription>
        </VisuallyHidden>
        <AlertDialogHeader>
          <AlertDialogTitle className="hidden md:block">
            {asset ? "Edit Asset" : "Create Asset"}
          </AlertDialogTitle>
        </AlertDialogHeader>
        <div className="grid max-h-[75vh] grid-cols-1 gap-y-3 overflow-y-scroll xl:grid-cols-2 xl:gap-x-8 xl:gap-y-2 xl:py-4">
          {fields.map(field => {
            const fieldId = field._id;
            const value = editedValues[fieldId];
            const label = typeof field.name === "string" ? field.name : fieldId;

            let input;
            if (field.type === "boolean") {
              input = (
                <Switch
                  id={fieldId}
                  checked={!!value}
                  onCheckedChange={v => handleFieldChange(fieldId, v)}
                  aria-invalid={!!errors[fieldId]}
                  disabled={isLockedBySomeoneElse}
                />
              );
            } else if (field.type === "select") {
              input = (
                <Select
                  value={(value as string) ?? ""}
                  onValueChange={v => handleFieldChange(fieldId, v)}
                >
                  <SelectTrigger
                    className={cn("col-span-3", {
                      "border-destructive": !!errors[fieldId]
                    })}
                    aria-invalid={!!errors[fieldId]}
                    disabled={isLockedBySomeoneElse}
                  >
                    {value ? String(value) : "Select an option"}
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
                    "border-destructive": !!errors[fieldId]
                  })}
                  draggable
                  disabled={isLockedBySomeoneElse}
                  validateTag={(tag: string) => {
                    if (field.extra?.listObjectType) {
                      if (
                        field.extra.listObjectType === "number" &&
                        isNaN(Number(tag))
                      )
                        return false;
                      if (
                        field.extra.listObjectType === "string" &&
                        field.extra.listObjectExtra?.regex &&
                        !new RegExp(field.extra.listObjectExtra.regex).test(tag)
                      )
                        return false;
                      if (
                        field.extra.listObjectType === "string" &&
                        field.extra.listObjectExtra?.minLength &&
                        tag.length < field.extra.listObjectExtra.minLength
                      )
                        return false;
                      if (
                        field.extra.listObjectType === "string" &&
                        field.extra.listObjectExtra?.maxLength &&
                        tag.length > field.extra.listObjectExtra.maxLength
                      )
                        return false;
                      if (
                        field.extra.listObjectType === "number" &&
                        field.extra.listObjectExtra?.minValue !== undefined &&
                        Number(tag) < field.extra.listObjectExtra.minValue
                      )
                        return false;
                      if (
                        field.extra.listObjectType === "number" &&
                        field.extra.listObjectExtra?.maxValue !== undefined &&
                        Number(tag) > field.extra.listObjectExtra.maxValue
                      )
                        return false;
                    }
                    return true;
                  }}
                />
              );
            } else if (field.type === "date") {
              input = (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      data-empty={!value}
                      className={cn(
                        "data-[empty=true]:text-muted-foreground col-span-3 text-left font-normal",
                        {
                          "border-destructive": !!errors[fieldId]
                        }
                      )}
                      disabled={isLockedBySomeoneElse}
                    >
                      <CalendarIcon />
                      {value ? (
                        format(value as string, "PPP")
                      ) : (
                        <span>{field.extra?.placeholder || "Pick a date"}</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={value ? new Date(value as string) : undefined}
                      onSelect={val =>
                        handleFieldChange(fieldId, val?.toISOString() || "")
                      }
                      captionLayout="dropdown"
                    />
                  </PopoverContent>
                </Popover>
              );
            } else if (field.type === "user") {
              if (users === undefined) {
                input = (
                  <Input id={fieldId} placeholder="Loading users..." disabled />
                );
              } else {
                input = (
                  <Popover
                    open={openPopovers[field._id]}
                    onOpenChange={() =>
                      setOpenPopovers(prev => ({
                        ...prev,
                        [field._id]: !prev[field._id]
                      }))
                    }
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="col-span-3 justify-between"
                        disabled={isLockedBySomeoneElse}
                      >
                        {value
                          ? users.find(user => user.id === value)?.email
                          : field.extra?.placeholder || "Select a user"}
                        <ChevronsUpDown className="opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0">
                      <Command>
                        <CommandInput
                          placeholder="Search users..."
                          className="h-9"
                          disabled={isLockedBySomeoneElse}
                        />
                        <CommandList>
                          <CommandEmpty>No users found.</CommandEmpty>
                          <CommandGroup>
                            {users.map(user => (
                              <CommandItem
                                key={user.id}
                                value={user.id}
                                keywords={[
                                  ...(user.email ? [user.email] : []),
                                  ...(user.name ? [user.name] : [])
                                ]}
                                onSelect={currentValue => {
                                  handleFieldChange(fieldId, currentValue);
                                  setOpenPopovers(prev => ({
                                    ...prev,
                                    [field._id]: false
                                  }));
                                }}
                                disabled={isLockedBySomeoneElse}
                              >
                                {user.email}
                                <Check
                                  className={cn(
                                    "ml-auto",
                                    value === user.id
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                );
              }
            } else if (field.type === "markdown") {
              if (!value && field.extra?.mdPreset)
                handleFieldChange(fieldId, field.extra.mdPreset);
              input = (
                <MarkdownEditor
                  className={cn("col-span-full", {
                    "border-destructive": !!errors[fieldId]
                  })}
                  value={String(value ?? "")}
                  onChange={value => handleFieldChange(fieldId, value)}
                  placeholder={field.extra?.placeholder}
                  disabled={isLockedBySomeoneElse}
                />
              );
            } else {
              input = (
                <Input
                  id={fieldId}
                  type={
                    ["number", "email", "url"].includes(field.type)
                      ? field.type
                      : "text"
                  }
                  className={cn("col-span-3", {
                    "border-destructive": !!errors[fieldId]
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
                  aria-invalid={!!errors[fieldId]}
                  disabled={isLockedBySomeoneElse}
                />
              );
            }

            return (
              <div
                key={fieldId}
                className={cn(
                  "grid items-center",
                  field.type === "markdown"
                    ? "col-span-full mt-2 grid-cols-2 gap-2"
                    : "grid-cols-1 gap-2 lg:col-span-1 lg:grid-cols-4 lg:gap-4"
                )}
              >
                <Label
                  htmlFor={fieldId}
                  className="text-muted-foreground text-right"
                >
                  {field.extra?.icon && (
                    <DynamicIcon
                      name={field.extra.icon as IconName}
                      className="inline size-4"
                    />
                  )}
                  {label}
                </Label>
                {input}
                <div className="h-1 md:hidden"></div>
              </div>
            );
          })}
        </div>

        {errors._ && <div className="text-destructive text-sm">{errors._}</div>}
        {Object.keys(errors).length > 0 && !errors._ && (
          <div className="text-destructive text-sm">
            Please fix the errors above before saving.
          </div>
        )}

        <AlertDialogFooter>
          <Button variant="outline" onClick={onClose} size="sm">
            <X />
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading || isLockedBySomeoneElse}
            size="sm"
          >
            {isLoading ? <Loader2Icon className="animate-spin" /> : <Save />}
            Save
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
