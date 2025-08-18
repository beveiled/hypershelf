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
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { useCallback, useEffect, useRef, useState } from "react";

export function useFieldLock(
  ingestLogs: (response: unknown, isError?: boolean) => void,
  renewIntervalMs = 30000,
  maxRenewals = 30
): {
  lockedId: Id<"fields"> | null;
  acquireLock: (id: Id<"fields">) => Promise<boolean>;
  releaseLock: (id?: Id<"fields">) => Promise<void>;
} {
  const [lockedId, setLockedId] = useState<Id<"fields"> | null>(null);
  const acquireLockFn = useMutation(api.locks.acquireField);
  const renewLockFn = useMutation(api.locks.renewField);
  const releaseLockFn = useMutation(api.locks.releaseField);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const renewsLeftRef = useRef(0);

  const clearRenewInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const release = useCallback(
    async (id?: Id<"fields">) => {
      const targetId = id ?? lockedId;
      if (!targetId) return;

      clearRenewInterval();
      let res;
      try {
        res = await releaseLockFn({ id: targetId });
      } catch (error) {
        console.error("Failed to release lock:", error);
        ingestLogs({ success: false, error: "Failed to release lock" }, true);
        return;
      }
      ingestLogs(res);
      setLockedId(null);
    },
    [lockedId, releaseLockFn, ingestLogs, clearRenewInterval]
  );

  const startRenewInterval = useCallback(
    (id: Id<"fields">) => {
      clearRenewInterval();
      renewsLeftRef.current = maxRenewals;
      intervalRef.current = setInterval(async () => {
        const res = await renewLockFn({ id });
        ingestLogs(res);
        renewsLeftRef.current -= 1;
        if (renewsLeftRef.current <= 0) {
          await release(id);
        }
      }, renewIntervalMs);
    },
    [
      renewLockFn,
      ingestLogs,
      maxRenewals,
      renewIntervalMs,
      clearRenewInterval,
      release
    ]
  );

  const acquire = useCallback(
    async (id: Id<"fields">) => {
      if (lockedId === id) return true;
      if (lockedId) await release(lockedId);

      let res;
      try {
        res = await acquireLockFn({ id });
      } catch (error) {
        console.error("Failed to acquire lock:", error);
        ingestLogs({ success: false, error: "Failed to acquire lock" }, true);
        return false;
      }

      ingestLogs(res);

      if (res.success) {
        setLockedId(id);
        startRenewInterval(id);
        return true;
      }

      return false;
    },
    [lockedId, acquireLockFn, ingestLogs, startRenewInterval, release]
  );

  useEffect(() => {
    const resetRenewals = () => {
      if (intervalRef.current) renewsLeftRef.current = maxRenewals;
    };

    window.addEventListener("mousemove", resetRenewals);

    return () => {
      window.removeEventListener("mousemove", resetRenewals);
      clearRenewInterval();
    };
  }, [maxRenewals, clearRenewInterval]);

  useEffect(() => {
    if (!lockedId) return;
    const beforeunload = (e: BeforeUnloadEvent) => {
      const confirmationMessage =
        "You have unsaved changes. Do you really want to leave?";
      (e || window.event).returnValue = confirmationMessage;
      return confirmationMessage;
    };
    window.addEventListener("beforeunload", beforeunload);
    return () => {
      window.removeEventListener("beforeunload", beforeunload);
    };
  }, [lockedId]);

  return { lockedId, acquireLock: acquire, releaseLock: release };
}

export function useAssetLock(
  ingestLogs: (response: unknown, isError?: boolean) => void,
  renewIntervalMs = 30000,
  maxRenewals = 30
): {
  lockedPairs: Array<{ assetId: Id<"assets">; fieldId: Id<"fields"> }>;
  isLocked: (assetId: Id<"assets">, fieldId: Id<"fields">) => boolean;
  acquireLock: (
    assetId: Id<"assets">,
    fieldId: Id<"fields">
  ) => Promise<boolean>;
  releaseLock: (assetId: Id<"assets">, fieldId: Id<"fields">) => Promise<void>;
  releaseAllLocks: () => Promise<void>;
} {
  const [lockedPairs, setLockedPairs] = useState<
    Array<{ assetId: Id<"assets">; fieldId: Id<"fields"> }>
  >([]);
  const acquireLockFn = useMutation(api.locks.acquireAsset);
  const renewLockFn = useMutation(api.locks.renewAsset);
  const releaseLockFn = useMutation(api.locks.releaseAsset);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const renewsLeftRef = useRef(0);

  const clearRenewInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const release = useCallback(
    async (assetId: Id<"assets">, fieldId: Id<"fields">) => {
      let res;
      try {
        res = await releaseLockFn({ assetId, fieldId });
      } catch (error) {
        console.error("Failed to release lock:", error);
        ingestLogs({ success: false, error: "Failed to release lock" }, true);
        return;
      }
      ingestLogs(res);
      setLockedPairs(prev =>
        prev.filter(p => !(p.assetId === assetId && p.fieldId === fieldId))
      );
    },
    [releaseLockFn, ingestLogs]
  );

  const releaseAllLocks = useCallback(async () => {
    clearRenewInterval();
    await Promise.all(lockedPairs.map(p => release(p.assetId, p.fieldId)));
  }, [lockedPairs, release, clearRenewInterval]);

  const startRenewInterval = useCallback(() => {
    clearRenewInterval();
    renewsLeftRef.current = maxRenewals;
    intervalRef.current = setInterval(async () => {
      setLockedPairs(currentLockedPairs => {
        if (currentLockedPairs.length === 0) {
          clearRenewInterval();
          return [];
        }

        Promise.all(
          currentLockedPairs.map(async p => {
            try {
              const res = await renewLockFn({
                assetId: p.assetId,
                fieldId: p.fieldId
              });
              ingestLogs(res);
              if (!res.success) {
                // If renewal fails, remove the lock from the list
                setLockedPairs(prev =>
                  prev.filter(
                    pair =>
                      !(
                        pair.assetId === p.assetId && pair.fieldId === p.fieldId
                      )
                  )
                );
              }
            } catch (error) {
              console.error("Failed to renew lock:", error);
              ingestLogs(
                { success: false, error: "Failed to renew lock" },
                true
              );
              // Also remove on error
              setLockedPairs(prev =>
                prev.filter(
                  pair =>
                    !(pair.assetId === p.assetId && pair.fieldId === p.fieldId)
                )
              );
            }
          })
        );

        return currentLockedPairs;
      });

      renewsLeftRef.current -= 1;
      if (renewsLeftRef.current <= 0) {
        releaseAllLocks();
      }
    }, renewIntervalMs);
  }, [
    renewLockFn,
    ingestLogs,
    maxRenewals,
    renewIntervalMs,
    clearRenewInterval,
    releaseAllLocks
  ]);

  const isLocked = useCallback(
    (assetId: Id<"assets">, fieldId: Id<"fields">) => {
      return lockedPairs.some(
        p => p.assetId === assetId && p.fieldId === fieldId
      );
    },
    [lockedPairs]
  );

  const acquire = useCallback(
    async (assetId: Id<"assets">, fieldId: Id<"fields">) => {
      if (isLocked(assetId, fieldId)) return true;

      let res;
      try {
        res = await acquireLockFn({ assetId, fieldId });
      } catch (error) {
        console.error("Failed to acquire lock:", error);
        ingestLogs({ success: false, error: "Failed to acquire lock" }, true);
        return false;
      }

      ingestLogs(res);

      if (res.success) {
        setLockedPairs(prev => {
          const newPairs = [...prev, { assetId, fieldId }];
          if (prev.length === 0) {
            startRenewInterval();
          }
          return newPairs;
        });
        return true;
      }

      return false;
    },
    [acquireLockFn, ingestLogs, startRenewInterval, isLocked]
  );

  useEffect(() => {
    const resetRenewals = () => {
      if (intervalRef.current) renewsLeftRef.current = maxRenewals;
    };

    window.addEventListener("mousemove", resetRenewals);

    return () => {
      window.removeEventListener("mousemove", resetRenewals);
      clearRenewInterval();
    };
  }, [maxRenewals, clearRenewInterval]);

  useEffect(() => {
    if (lockedPairs.length === 0) return;
    const beforeunload = (e: BeforeUnloadEvent) => {
      const confirmationMessage =
        "You have unsaved changes. Do you really want to leave?";
      (e || window.event).returnValue = confirmationMessage;
      return confirmationMessage;
    };
    window.addEventListener("beforeunload", beforeunload);
    return () => {
      window.removeEventListener("beforeunload", beforeunload);
    };
  }, [lockedPairs]);

  useEffect(() => {
    if (lockedPairs.length === 0) {
      clearRenewInterval();
    }
  }, [lockedPairs, clearRenewInterval]);

  return {
    lockedPairs,
    isLocked,
    acquireLock: acquire,
    releaseLock: release,
    releaseAllLocks
  };
}
