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
import { useEffect, useRef, useState, useCallback } from "react";
import { Id, TableNames } from "@/convex/_generated/dataModel";
import { FunctionReference } from "convex/server";
import { useMutation } from "convex/react";

export function useLock<T extends TableNames>(
  acquireLock: FunctionReference<"mutation">,
  renewLock: FunctionReference<"mutation">,
  releaseLock: FunctionReference<"mutation">,
  ingestLogs: (response: unknown, isError?: boolean) => void,
  renewIntervalMs = 30000,
  maxRenewals = 30
): {
  lockedId: Id<T> | null;
  acquireLock: (id: Id<T>) => Promise<boolean>;
  releaseLock: (id?: Id<T>) => Promise<void>;
} {
  const [lockedId, setLockedId] = useState<Id<T> | null>(null);
  const acquireLockFn = useMutation(acquireLock);
  const renewLockFn = useMutation(renewLock);
  const releaseLockFn = useMutation(releaseLock);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const renewsLeftRef = useRef(0);

  const clearRenewInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const release = useCallback(
    async (id?: Id<T>) => {
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
    (id: Id<T>) => {
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
    async (id: Id<T>) => {
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
        // TODO: Show warning when leaving the page with edited form
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

  return { lockedId, acquireLock: acquire, releaseLock: release };
}
