"use client";

import { useEffect } from "react";
import { isEqual } from "lodash";
import { useStoreWithEqualityFn } from "zustand/traditional";

import { useHypershelf } from "@hypershelf/lib/stores";
import { Skeleton } from "@hypershelf/ui/primitives/skeleton";

import { FieldCard } from "~/components/inventories/fields/FieldCard";
import { NewFieldForm } from "~/components/inventories/fields/FieldForm";
import { useFieldLock } from "~/components/inventories/useLock";
import { useHeaderContent } from "~/components/util/HeaderContext";

export default function FieldsInventory() {
  const locker = useFieldLock(30000, 30);

  const fieldsLoading = useHypershelf((state) => state.loadingFields);
  const setFieldsLocker = useHypershelf((state) => state.setFieldsLocker);
  const fieldIds = useStoreWithEqualityFn(
    useHypershelf,
    (state) => state.fieldIds,
    isEqual,
  );

  const { setContent: setHeaderContent } = useHeaderContent();

  useEffect(() => {
    setHeaderContent(null);
  }, [setHeaderContent]);

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
      <div className="gap-4 flex flex-col">
        <div className="max-w-2xl pb-8 mx-auto w-full">
          <div className="gap-4 pt-6 md:px-4 flex flex-col">
            <h1 className="mb-2 text-2xl font-extrabold relative font-title">
              Fields
              <div className="bottom-0 left-0 h-1 w-6 absolute bg-brand"></div>
            </h1>
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="mb-4 h-19.5 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );

  return (
    <div className="gap-4 flex flex-col">
      <div className="max-w-2xl pb-8 mx-auto w-full">
        <div className="gap-4 pt-6 md:px-4 flex flex-col">
          <h1 className="mx-4 mb-2 text-xl font-extrabold md:text-2xl relative font-title">
            Fields
            <div className="bottom-0 left-0 h-1 w-5 md:w-6 absolute bg-brand"></div>
          </h1>
          {fieldIds.map((fieldId) => {
            return <FieldCard key={fieldId} fieldId={fieldId} />;
          })}
          <NewFieldForm />
        </div>
      </div>
    </div>
  );
}
