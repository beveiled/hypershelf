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
  AlertDialog,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { GlobalKeySequenceListener } from "@/components/util/GlobalKeySequenceListener";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { FieldType } from "@/convex/fields";
import { cn } from "@/lib/utils";
import {
  AlertDialogCancel,
  AlertDialogTrigger
} from "@radix-ui/react-alert-dialog";
import { useMutation, useQuery } from "convex/react";
import { WithoutSystemFields } from "convex/server";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Loader2, Lock, Plus } from "lucide-react";
import { DynamicIcon, IconName } from "lucide-react/dynamic";
import { useEffect, useState } from "react";
import { Debugger } from "../Debugger";
import { useFieldLock } from "../useLock";
import { FieldForm } from "./FieldForm";
import { Skeleton } from "@/components/ui/skeleton";

const defaultNewField: WithoutSystemFields<Omit<FieldType, "slug">> = {
  name: "",
  type: "string",
  required: false,
  extra: {}
};

export function FieldsInventory() {
  const { viewer } = useQuery(api.users.me) ?? {};
  const { fields } = useQuery(api.fields.get) ?? {};
  const deleteField = useMutation(api.fields.remove);
  const makePerstent = useMutation(api.fields.makePersistent);

  const [expandedFieldId, setExpandedFieldId] = useState<
    Id<"fields"> | "new" | null
  >(null);
  const [editValues, setEditValues] = useState<WithoutSystemFields<
    Omit<FieldType, "slug">
  > | null>(null);
  const [isDebug, setIsDebug] = useState(false);
  const [isConfirmLock, setIsConfirmLock] = useState(false);
  const [isLocking, setIsLocking] = useState(false);
  const [lockTimeout, setLockTimeout] = useState(0);

  const { lockedId, acquireLock, releaseLock } = useFieldLock(30000, 30);

  const handleExpand = (field: FieldType) => {
    if (field._id === expandedFieldId && lockedId) return;
    if (field.editingBy && field.editingBy !== viewer) return;
    if (expandedFieldId && lockedId) releaseLock();
    if (expandedFieldId === field._id) {
      setExpandedFieldId(null);
      setEditValues(null);
      return;
    }
    setExpandedFieldId(field._id);
    setEditValues(field);
  };

  const lockField = () => {
    if (expandedFieldId && expandedFieldId !== "new" && !lockedId) {
      acquireLock(expandedFieldId);
    }
  };

  const handleCreateClick = () => {
    setEditValues(defaultNewField);
    setExpandedFieldId("new");
  };

  useEffect(() => {
    if (lockTimeout > 0) {
      const timer = setTimeout(() => {
        setLockTimeout(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [lockTimeout]);

  if (!fields)
    return (
      <div className="mx-auto w-full max-w-2xl pb-8">
        <div className="flex flex-col gap-4 pt-6 md:px-4">
          <h1 className="font-title relative mb-2 text-2xl font-extrabold">
            Fields
            <div className="bg-brand absolute bottom-0 left-0 h-1 w-6"></div>
          </h1>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="mb-4 h-19.5 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );

  return (
    <div className="mx-auto w-full max-w-2xl pb-8">
      <Debugger
        data={
          (expandedFieldId &&
            fields.find(f => f.field._id === expandedFieldId)?.field) ||
          fields
        }
        open={isDebug}
        setIsOpen={setIsDebug}
        rootName={
          (expandedFieldId &&
            `Field <${fields.find(f => f.field._id === expandedFieldId)?.field.name}>`) ||
          "Fields"
        }
        defaultExpanded={
          !!(
            expandedFieldId && fields.find(f => f.field._id === expandedFieldId)
          )
        }
      >
        {expandedFieldId &&
          fields.find(f => f.field._id === expandedFieldId) &&
          !(
            expandedFieldId &&
            fields.find(f => f.field._id === expandedFieldId)?.field.persistent
          ) && (
            <AlertDialog open={isConfirmLock} onOpenChange={setIsConfirmLock}>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setLockTimeout(10);
                  }}
                >
                  <Lock />
                  Заблокировать поле
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-2xl">
                    Блокировка поля
                  </AlertDialogTitle>
                </AlertDialogHeader>
                <p className="text-sm">
                  Заблокированное поле нельзя будет удалить
                </p>
                <p className="text-destructive text-sm font-bold">
                  Это действие нельзя отменить!
                </p>
                <AlertDialogFooter>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setIsLocking(true);
                      makePerstent({
                        fieldId: expandedFieldId as Id<"fields">
                      });
                      setIsLocking(false);
                      setIsConfirmLock(false);
                    }}
                    disabled={isLocking || lockTimeout > 0}
                    className={cn(lockTimeout > 0 && "cursor-not-allowed")}
                  >
                    {lockTimeout > 0 ? (
                      <span>
                        {lockTimeout}
                        &nbsp;
                      </span>
                    ) : isLocking ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <Lock />
                    )}
                    Заблокировать
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
      <div className="flex flex-col gap-4 pt-6 md:px-4">
        <h1 className="font-title relative mx-4 mb-2 text-xl font-extrabold md:text-2xl">
          Fields
          <div className="bg-brand absolute bottom-0 left-0 h-1 w-5 md:w-6"></div>
        </h1>

        {expandedFieldId === "new" && (
          <AlertDialog open={expandedFieldId === "new"} onOpenChange={() => {}}>
            <AlertDialogContent className="!max-w-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle className="font-title relative text-left text-2xl font-extrabold">
                  New Field
                  <div className="bg-brand absolute bottom-0 left-0 h-1 w-8"></div>
                </AlertDialogTitle>
              </AlertDialogHeader>
              <FieldForm
                initialValues={defaultNewField}
                lockField={() => {}}
                locked={true}
                onCancel={() => {
                  setExpandedFieldId(null);
                }}
                isLockedBySomeoneElse={false}
              />
            </AlertDialogContent>
          </AlertDialog>
        )}

        {fields.map(({ field, editingBy }) => {
          const isExpanded = expandedFieldId === field._id;
          const values = isExpanded ? editValues! : field;
          return (
            <motion.div
              key={field._id}
              initial={false}
              animate={{
                boxShadow: isExpanded
                  ? "0 8px 32px rgba(0,0,0,0.25)"
                  : "0 1px 4px rgba(0,0,0,0.10)"
              }}
              className={cn(
                "bg-background relative rounded-lg border p-4 shadow-sm transition-all",
                {
                  "shadow-lg": isExpanded,
                  "border-brand border-2":
                    field.editingBy && editingBy !== viewer
                }
              )}
            >
              {field.editingBy && editingBy !== viewer && (
                <div className="bg-brand text-background absolute top-0 right-0 -translate-y-full rounded-sm px-2 py-0.5 text-xs">
                  <span className="font-semibold">{editingBy?.email}</span>
                </div>
              )}
              <div
                className={cn("flex items-center", {
                  "cursor-pointer": !field.editingBy || editingBy === viewer,
                  "cursor-not-allowed": field.editingBy && editingBy !== viewer
                })}
                onClick={() => handleExpand(field)}
              >
                <span className="mr-3 text-2xl">
                  <DynamicIcon
                    name={(values.extra?.icon as IconName) || "circle"}
                  />
                </span>
                <div className="flex-1">
                  <div className="font-semibold">{field.name}</div>
                  <div className="text-muted-foreground text-sm">
                    {field.extra?.description}
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
                  <FieldForm
                    fieldId={field._id}
                    initialValues={editValues!}
                    lockField={lockField}
                    locked={!!lockedId}
                    onCancel={() => {
                      releaseLock();
                      setExpandedFieldId(null);
                      setEditValues(null);
                    }}
                    onDelete={
                      field.persistent
                        ? undefined
                        : () => deleteField({ fieldId: field._id })
                    }
                    isLockedBySomeoneElse={
                      (field.editingBy && field.editingBy !== viewer) || false
                    }
                  />
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}

        <div className="flex">
          <Button
            variant="outline"
            className="w-full"
            onClick={handleCreateClick}
          >
            <Plus />
            Создать новое поле
          </Button>
        </div>
      </div>
    </div>
  );
}
