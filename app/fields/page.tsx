"use client";

import { FieldCard } from "@/components/inventories/fields/FieldCard";
import { NewFieldForm } from "@/components/inventories/fields/FieldForm";
import { useFieldLock } from "@/components/inventories/useLock";
import { Skeleton } from "@/components/ui/skeleton";
import { shallowPositional } from "@/lib/utils";
import { useHypershelf } from "@/stores";
import { useEffect } from "react";
import { useStoreWithEqualityFn } from "zustand/traditional";

export default function FieldsInventory() {
  const locker = useFieldLock(30000, 30);

  const fieldsLoading = useHypershelf(state => state.loadingFields);
  const setFieldsLocker = useHypershelf(state => state.setFieldsLocker);
  const fieldIds = useStoreWithEqualityFn(
    useHypershelf,
    state => state.fieldIds,
    shallowPositional,
  );

  useEffect(
    () =>
      setFieldsLocker({
        release: locker.releaseLock,
        acquire: locker.acquireLock,
      }),
    [locker, setFieldsLocker],
  );

  if (fieldsLoading)
    return (
      <div className="flex flex-col gap-4">
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
      </div>
    );

  return (
    <div className="flex flex-col gap-4">
      <div className="mx-auto w-full max-w-2xl pb-8">
        <div className="flex flex-col gap-4 pt-6 md:px-4">
          <h1 className="font-title relative mx-4 mb-2 text-xl font-extrabold md:text-2xl">
            Fields
            <div className="bg-brand absolute bottom-0 left-0 h-1 w-5 md:w-6"></div>
          </h1>
          {fieldIds.map(fieldId => {
            return <FieldCard key={fieldId} fieldId={fieldId} />;
          })}
          <NewFieldForm />
        </div>
      </div>
    </div>
  );
}
