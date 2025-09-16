import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { useCallback, useEffect, useRef, useState } from "react";

export function useFieldLock(
  renewIntervalMs = 30000,
  maxRenewals = 30,
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
      try {
        await releaseLockFn({ id: targetId });
      } catch (error) {
        console.error("Failed to release lock:", error);
        return;
      }
      setLockedId(null);
    },
    [lockedId, releaseLockFn, clearRenewInterval],
  );

  const startRenewInterval = useCallback(
    (id: Id<"fields">) => {
      clearRenewInterval();
      renewsLeftRef.current = maxRenewals;
      intervalRef.current = setInterval(async () => {
        await renewLockFn({ id });
        renewsLeftRef.current -= 1;
        if (renewsLeftRef.current <= 0) {
          await release(id);
        }
      }, renewIntervalMs);
    },
    [renewLockFn, maxRenewals, renewIntervalMs, clearRenewInterval, release],
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
        return false;
      }

      if (res.success) {
        setLockedId(id);
        startRenewInterval(id);
        return true;
      }

      return false;
    },
    [lockedId, acquireLockFn, startRenewInterval, release],
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
      e.preventDefault();
    };
    window.addEventListener("beforeunload", beforeunload);
    return () => {
      window.removeEventListener("beforeunload", beforeunload);
    };
  }, [lockedId]);

  return { lockedId, acquireLock: acquire, releaseLock: release };
}

export function useAssetLock(
  renewIntervalMs = 30000,
  maxRenewals = 30,
): {
  lockedPairs: Array<{ assetId: Id<"assets">; fieldId: Id<"fields"> }>;
  isLocked: (assetId: Id<"assets">, fieldId: Id<"fields">) => boolean;
  acquireLock: (
    assetId: Id<"assets">,
    fieldId: Id<"fields">,
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
      try {
        await releaseLockFn({ assetId, fieldId });
      } catch (error) {
        console.error("Failed to release lock:", error);
        return;
      }
      setLockedPairs(prev =>
        prev.filter(p => !(p.assetId === assetId && p.fieldId === fieldId)),
      );
    },
    [releaseLockFn],
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
                fieldId: p.fieldId,
              });
              if (!res.success) {
                setLockedPairs(prev =>
                  prev.filter(
                    pair =>
                      !(
                        pair.assetId === p.assetId && pair.fieldId === p.fieldId
                      ),
                  ),
                );
              }
            } catch (error) {
              console.error("Failed to renew lock:", error);
              setLockedPairs(prev =>
                prev.filter(
                  pair =>
                    !(pair.assetId === p.assetId && pair.fieldId === p.fieldId),
                ),
              );
            }
          }),
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
    maxRenewals,
    renewIntervalMs,
    clearRenewInterval,
    releaseAllLocks,
  ]);

  const isLocked = useCallback(
    (assetId: Id<"assets">, fieldId: Id<"fields">) => {
      return lockedPairs.some(
        p => p.assetId === assetId && p.fieldId === fieldId,
      );
    },
    [lockedPairs],
  );

  const acquire = useCallback(
    async (assetId: Id<"assets">, fieldId: Id<"fields">) => {
      if (isLocked(assetId, fieldId)) return true;

      let res;
      try {
        res = await acquireLockFn({ assetId, fieldId });
      } catch (error) {
        console.error("Failed to acquire lock:", error);
        return false;
      }

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
    [acquireLockFn, startRenewInterval, isLocked],
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
    const beforeunload = () => {
      return "You have unsaved changes. Do you really want to leave?";
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
    releaseAllLocks,
  };
}
