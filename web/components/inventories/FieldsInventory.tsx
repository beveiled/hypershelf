"use client";
// TODO: draggable fields for default position

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { IconName, IconPicker } from "@/components/ui/icon-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OptionsInput } from "@/components/ui/options-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { api } from "@/convex/_generated/api";
import { FieldType } from "@/convex/fields";
import { ValueType } from "@/convex/schema";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "convex/react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { DynamicIcon } from "lucide-react/dynamic";
import { useState } from "react";

export function FieldsInventory() {
  const { fields, viewer } = useQuery(api.fields.getAll) ?? { fields: [] };
  const acquireLock = useMutation(api.fields.acquireLock);
  const releaseLock = useMutation(api.fields.releaseLock);
  const updateField = useMutation(api.fields.updateField);

  const [expandedFieldId, setExpandedFieldId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<FieldType | null>(null);
  const [pendingType, setPendingType] = useState<string | null>(null);

  const handleExpand = (field: FieldType) => {
    if (field._id === expandedFieldId) {
      return;
    }
    if (field.editing && field.editingBy !== viewer) {
      console.warn(
        "Field is currently being edited by another user:",
        field.editingBy
      );
      return;
    }
    setExpandedFieldId(field._id === expandedFieldId ? null : field._id);
    acquireLock({ fieldId: field._id }).catch(error => {
      console.error("Failed to acquire lock:", error);
    });
    setEditValues(field);
  };

  const handleChange = (fieldId: string, key: string, value: ValueType) => {
    setEditValues(prev => {
      if (!prev) return prev;
      if (!fields) return prev;
      const field = fields.find(
        (f: { field: FieldType }) => f.field._id === fieldId
      );
      const isExtra = key in (field?.field.extra || {});
      return {
        ...prev,
        ...(isExtra
          ? { extra: { ...prev.extra, [key]: value } }
          : { [key]: value })
      };
    });
  };

  const handleSave = (fieldId: string) => {
    const field = fields?.find(
      (f: { field: FieldType }) => f.field._id === fieldId
    );
    if (!field || !editValues) {
      console.warn(
        "Field not found or no edit values available:",
        fieldId,
        editValues
      );
      return;
    }
    console.log("Saving field:", fieldId, editValues);
    updateField({
      fieldId: field.field._id,
      name: editValues.name,
      slug: editValues.slug,
      type: editValues.type,
      required: editValues.required,
      extra: editValues.extra || {}
    }).catch(error => {
      console.error("Failed to update field:", error);
    });
    releaseLock({ fieldId: field.field._id }).catch(error => {
      console.error("Failed to release lock:", error);
    });
    setExpandedFieldId(null);
  };
  const FIELD_TYPES = [
    {
      value: "string",
      label: "String",
      extras: [
        "icon",
        "description",
        "placeholder",
        "regex",
        "regexError",
        "minLength",
        "maxLength"
      ]
    },
    {
      value: "number",
      label: "Number",
      extras: ["icon", "description", "placeholder", "minValue", "maxValue"]
    },
    { value: "boolean", label: "Boolean", extras: ["icon", "description"] },
    // TODO: inner element validation rules UI for arrays
    {
      value: "array",
      label: "Array",
      extras: ["icon", "description", "minItems", "maxItems"]
    },
    {
      value: "select",
      label: "Select",
      extras: ["icon", "description", "options"]
    }
    // TODO: date, email, user, url types
    // TODO: placeholder for markdown type
  ];

  function getExtrasForType(type: string) {
    return FIELD_TYPES.find(t => t.value === type)?.extras ?? [];
  }

  if (fields === undefined) {
    // TODO: replace with skeleton
    return (
      <div className="mx-auto">
        <p>loading...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl pb-8">
      <div className="flex flex-col gap-4 px-4 pt-6">
        <h1 className="font-title mb-2 text-2xl font-extrabold">
          Fields Management
        </h1>
        {fields.map(field => {
          const isExpanded = expandedFieldId === field.field._id;
          const values = isExpanded ? editValues : field.field;
          if (!values) return null;
          const typeExtras = getExtrasForType(values.type);

          const formFields = [
            {
              key: "name",
              node: (
                <div className="flex flex-col gap-1">
                  <Label className="block text-xs font-medium">Name</Label>
                  <Input
                    value={values.name}
                    onChange={e =>
                      handleChange(field.field._id, "name", e.target.value)
                    }
                  />
                </div>
              )
            },
            {
              key: "type",
              node: (
                <div className="relative flex flex-col gap-1">
                  <Label className="block text-xs font-medium">Type</Label>
                  <Select
                    value={values.type}
                    onValueChange={val => {
                      const extras = getExtrasForType(values.type);
                      const hasExtras = extras.some(k => {
                        const v =
                          values.extra?.[k as keyof typeof values.extra];
                        return Array.isArray(v)
                          ? v.length > 0
                          : v != null && v !== "";
                      });

                      if (hasExtras) {
                        setPendingType(val);
                      } else {
                        handleChange(field.field._id, "type", val);
                      }
                    }}
                    disabled={pendingType !== null}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {FIELD_TYPES.map(t => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {pendingType && (
                    <Alert className="absolute top-full -mt-2 -ml-3">
                      <AlertTitle>Change type?</AlertTitle>
                      <AlertDescription>
                        Changing the type will remove extra fields for the
                        current type.
                      </AlertDescription>
                      <div className="mt-2 flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            handleChange(field.field._id, "type", pendingType);
                            setPendingType(null);
                          }}
                          variant={"destructive"}
                        >
                          Change
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPendingType(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </Alert>
                  )}
                </div>
              )
            },
            ...(typeExtras.includes("icon")
              ? [
                  {
                    key: "icon",
                    node: (
                      <div className="flex flex-col gap-1">
                        <Label className="block text-xs font-medium">
                          Icon
                        </Label>
                        <IconPicker
                          value={(values.extra?.icon as IconName) || ""}
                          onValueChange={value =>
                            handleChange(field.field._id, "icon", value)
                          }
                        />
                      </div>
                    )
                  }
                ]
              : []),
            ...(typeExtras.includes("description")
              ? [
                  {
                    key: "description",
                    node: (
                      <div className="flex flex-col gap-1">
                        <Label className="block text-xs font-medium">
                          Description
                        </Label>
                        <Input
                          value={values.extra?.description || ""}
                          onChange={e =>
                            handleChange(
                              field.field._id,
                              "description",
                              e.target.value
                            )
                          }
                        />
                      </div>
                    )
                  }
                ]
              : []),
            ...(typeExtras.includes("placeholder")
              ? [
                  {
                    key: "placeholder",
                    node: (
                      <div className="flex flex-col gap-1">
                        <Label className="block text-xs font-medium">
                          Placeholder
                        </Label>
                        <Input
                          value={values.extra?.placeholder || ""}
                          onChange={e =>
                            handleChange(
                              field.field._id,
                              "placeholder",
                              e.target.value
                            )
                          }
                        />
                      </div>
                    )
                  }
                ]
              : []),
            ...(typeExtras.includes("regex")
              ? [
                  {
                    key: "regex",
                    node: (
                      <div className="flex flex-col gap-1">
                        <Label className="block text-xs font-medium">
                          Regex
                        </Label>
                        <Input
                          value={values.extra?.regex || ""}
                          onChange={e =>
                            handleChange(
                              field.field._id,
                              "regex",
                              e.target.value
                            )
                          }
                        />
                      </div>
                    )
                  }
                ]
              : []),
            ...(typeExtras.includes("regexError")
              ? [
                  {
                    key: "regexError",
                    node: (
                      <div className="flex flex-col gap-1">
                        <Label className="block text-xs font-medium">
                          Regex Error
                        </Label>
                        <Input
                          value={values.extra?.regexError || ""}
                          onChange={e =>
                            handleChange(
                              field.field._id,
                              "regexError",
                              e.target.value
                            )
                          }
                        />
                      </div>
                    )
                  }
                ]
              : []),
            ...(typeExtras.includes("minLength")
              ? [
                  {
                    key: "minLength",
                    node: (
                      <div className="flex flex-col gap-1">
                        <Label className="block text-xs font-medium">
                          Min Length
                        </Label>
                        <Input
                          type="number"
                          value={values.extra?.minLength ?? ""}
                          onChange={e =>
                            handleChange(
                              field.field._id,
                              "minLength",
                              e.target.value === ""
                                ? undefined
                                : Number(e.target.value)
                            )
                          }
                          // TODO: fix controlled state input bug
                        />
                      </div>
                    )
                  }
                ]
              : []),
            ...(typeExtras.includes("maxLength")
              ? [
                  {
                    key: "maxLength",
                    node: (
                      <div className="flex flex-col gap-1">
                        <Label className="block text-xs font-medium">
                          Max Length
                        </Label>
                        <Input
                          type="number"
                          value={values.extra?.maxLength ?? ""}
                          onChange={e =>
                            handleChange(
                              field.field._id,
                              "maxLength",
                              e.target.value === ""
                                ? undefined
                                : Number(e.target.value)
                            )
                          }
                          // TODO: fix controlled state input bug
                        />
                      </div>
                    )
                  }
                ]
              : []),
            ...(typeExtras.includes("minItems")
              ? [
                  {
                    key: "minItems",
                    node: (
                      <div className="flex flex-col gap-1">
                        <Label className="block text-xs font-medium">
                          Min Items
                        </Label>
                        <Input
                          type="number"
                          value={values.extra?.minItems ?? ""}
                          onChange={e =>
                            handleChange(
                              field.field._id,
                              "minItems",
                              e.target.value === ""
                                ? undefined
                                : Number(e.target.value)
                            )
                          }
                        />
                      </div>
                    )
                  }
                ]
              : []),
            ...(typeExtras.includes("maxItems")
              ? [
                  {
                    key: "maxItems",
                    node: (
                      <div className="flex flex-col gap-1">
                        <Label className="block text-xs font-medium">
                          Max Items
                        </Label>
                        <Input
                          type="number"
                          value={values.extra?.maxItems ?? ""}
                          onChange={e =>
                            handleChange(
                              field.field._id,
                              "maxItems",
                              e.target.value === ""
                                ? undefined
                                : Number(e.target.value)
                            )
                          }
                        />
                      </div>
                    )
                  }
                ]
              : []),
            ...(typeExtras.includes("minValue")
              ? [
                  {
                    key: "minValue",
                    node: (
                      <div className="flex flex-col gap-1">
                        <Label className="block text-xs font-medium">
                          Min Value
                        </Label>
                        <Input
                          type="number"
                          value={values.extra?.minValue ?? ""}
                          onChange={e =>
                            handleChange(
                              field.field._id,
                              "minValue",
                              e.target.value === ""
                                ? undefined
                                : Number(e.target.value)
                            )
                          }
                        />
                      </div>
                    )
                  }
                ]
              : []),
            ...(typeExtras.includes("options")
              ? [
                  {
                    key: "options",
                    node: (
                      <div className="flex flex-col gap-1">
                        <Label className="block text-xs font-medium">
                          Options
                        </Label>
                        <OptionsInput
                          options={values.extra?.options || []}
                          onChange={options =>
                            handleChange(field.field._id, "options", options)
                          }
                        />
                      </div>
                    )
                  }
                ]
              : []),
            ...(typeExtras.includes("maxValue")
              ? [
                  {
                    key: "maxValue",
                    node: (
                      <div className="flex flex-col gap-1">
                        <Label className="block text-xs font-medium">
                          Max Value
                        </Label>
                        <Input
                          type="number"
                          value={values.extra?.maxValue ?? ""}
                          onChange={e =>
                            handleChange(
                              field.field._id,
                              "maxValue",
                              e.target.value === ""
                                ? undefined
                                : Number(e.target.value)
                            )
                          }
                        />
                      </div>
                    )
                  }
                ]
              : []),
            {
              key: "hideFromSearch",
              node: (
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={!!values.extra?.hideFromSearch}
                    onCheckedChange={checked =>
                      handleChange(field.field._id, "hideFromSearch", !!checked)
                    }
                    id={`hideFromSearch-${field.field._id}`}
                  />
                  <Label
                    htmlFor={`hideFromSearch-${field.field._id}`}
                    className="text-xs font-medium"
                  >
                    Hide from search
                  </Label>
                </div>
              ),
              full: true
            },
            {
              key: "required",
              node: (
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={!!values.required}
                    onCheckedChange={checked =>
                      handleChange(field.field._id, "required", !!checked)
                    }
                    id={`required-${field.field._id}`}
                  />
                  <Label
                    htmlFor={`required-${field.field._id}`}
                    className="text-xs font-medium"
                  >
                    Required
                  </Label>
                </div>
              ),
              full: true
            },
            {
              key: "actions",
              node: (
                <div className="col-span-full mt-4 flex gap-2">
                  <Button
                    type="submit"
                    variant="default"
                    size="sm"
                    onClick={() => {
                      if (!editValues) return;
                      handleSave(field.field._id);
                    }}
                  >
                    Save
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setExpandedFieldId(null);
                      releaseLock({ fieldId: field.field._id }).catch(error => {
                        console.error("Failed to release lock:", error);
                      });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              ),
              full: true
            }
          ];

          return (
            <motion.div
              key={field.field._id}
              layout
              initial={false}
              animate={{
                boxShadow: isExpanded
                  ? "0 8px 32px rgba(0,0,0,0.25)"
                  : "0 1px 4px rgba(0,0,0,0.10)"
              }}
              transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
              className={cn(
                "relative rounded-lg border bg-black p-4 shadow-sm transition-all",
                {
                  "shadow-lg": isExpanded,
                  "border-brand border-2":
                    field.field.editing && field.editingBy !== viewer
                }
              )}
            >
              {field.field.editing && field.editingBy !== viewer && (
                <div className="bg-brand text-background absolute top-0 right-0 -translate-y-full rounded-sm px-2 py-0.5 text-xs">
                  <span className="font-semibold">
                    {field.editingBy?.email}
                  </span>
                </div>
              )}
              <div
                className={cn("flex items-center", {
                  "cursor-pointer":
                    !field.field.editing || field.editingBy === viewer,
                  "cursor-not-allowed":
                    field.field.editing && field.editingBy !== viewer
                })}
                onClick={() => handleExpand(field.field)}
              >
                <span className="mr-3 text-2xl">
                  <DynamicIcon
                    name={(values.extra?.icon as IconName) || "circle"}
                  />
                </span>
                <div className="flex-1">
                  <div className="font-semibold">{field.field.name}</div>
                  <div className="text-muted-foreground text-sm">
                    {field.field.extra?.description}
                  </div>
                </div>
                <Button variant="ghost" size="icon">
                  <ChevronDown
                    className={cn(
                      "transition-transform",
                      isExpanded ? "rotate-180" : "rotate-0"
                    )}
                  />
                </Button>
              </div>
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.form
                    key="form"
                    className="grid grid-cols-1 gap-4 px-2 md:grid-cols-2"
                    onClick={e => e.stopPropagation()}
                    onSubmit={e => e.preventDefault()}
                    initial="collapsed"
                    animate="open"
                    exit="collapsed"
                    variants={{
                      open: { opacity: 1, height: "auto", marginTop: 16 },
                      collapsed: { opacity: 0, height: 0, marginTop: 0 }
                    }}
                    transition={{
                      opacity: {
                        duration: formFields.length * 0.03 + 0.15,
                        type: "spring",
                        bounce: 0.2
                      },
                      height: {
                        duration: formFields.length * 0.03 + 0.15,
                        type: "spring",
                        bounce: 0.2
                      },
                      marginTop: {
                        duration: formFields.length * 0.03,
                        ease: "easeInOut"
                      }
                    }}
                    style={{ overflow: "hidden" }}
                  >
                    <motion.div
                      className="contents"
                      variants={{
                        open: {
                          transition: {
                            staggerChildren: 0.07,
                            delayChildren: 0.1
                          }
                        },
                        collapsed: {
                          transition: {
                            staggerChildren: 0.03,
                            staggerDirection: -1
                          }
                        }
                      }}
                    >
                      {formFields.map((f, idx) => {
                        const collapseDelay =
                          (formFields.length - 1 - idx) * 0.03;
                        return (
                          <motion.div
                            key={f.key}
                            className={f.full ? "col-span-full" : ""}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{
                              opacity: 1,
                              y: 0,
                              transition: { duration: 0.15, delay: idx * 0.03 }
                            }}
                            exit={{
                              opacity: 0,
                              y: 10,
                              transition: {
                                duration: 0.15,
                                delay: collapseDelay
                              }
                            }}
                          >
                            {f.node}
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  </motion.form>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
