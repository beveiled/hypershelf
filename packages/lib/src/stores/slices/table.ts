import { isEqual } from "lodash";

import type { Id } from "@hypershelf/convex/_generated/dataModel";
import type { IndexedVM } from "@hypershelf/convex/schema";

import type { ImmerStateCreator, TableSlice } from "../types";

export const tableSlice: ImmerStateCreator<TableSlice> = (set) => ({
  toggleHiding: () => {
    set((state) => {
      state.hiding = !state.hiding;
      localStorage.setItem("hiding", state.hiding ? "1" : "0");
    });
  },
  setSorting: (sorting) => {
    set((state) => {
      for (const [fieldId, order] of Object.entries(sorting) as [
        Id<"fields">,
        "asc" | "desc",
      ][]) {
        if (state.sorting[fieldId] !== order) {
          state.sorting[fieldId] = order;
        }
      }
      for (const fieldId of Object.keys(state.sorting)) {
        if (!sorting[fieldId as Id<"fields">]) {
          delete state.sorting[fieldId as Id<"fields">];
        }
      }
    });
  },
  toggleSorting: (fieldId) => {
    set((state) => {
      const current = state.sorting[fieldId];
      if (current === "asc") {
        state.sorting[fieldId] = "desc";
      } else if (current === "desc") {
        delete state.sorting[fieldId];
      } else {
        state.sorting[fieldId] = "asc";
      }
    });
  },
  toggleVisibility: (fieldId) => {
    set((state) => {
      if (state.hiddenFields.includes(fieldId)) {
        for (let i = 0; i < state.hiddenFields.length; i++) {
          if (state.hiddenFields[i] === fieldId) {
            state.hiddenFields.splice(i, 1);
            break;
          }
        }
      } else {
        state.hiddenFields.push(fieldId);
      }
    });
  },
  reorderField: (from, to) =>
    set((state) => {
      if (state.fieldOrder.length === 0) {
        state.fieldOrder = [...state.fieldIds];
      }
      const fromIndex = state.fieldOrder.indexOf(from);
      const toIndex = state.fieldOrder.indexOf(to);
      if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return;
      state.fieldOrder.splice(fromIndex, 1);
      state.fieldOrder.splice(toIndex, 0, from);
      if (isEqual(state.fieldOrder, state.fieldIds)) {
        state.fieldOrder = [];
      }
    }),
  setFilters: (filters) => {
    set((state) => {
      state.filters = filters;
      state.createdAssets = [];
    });
  },
  setIsFiltering: (isFiltering) => {
    set((state) => {
      state.isFiltering = isFiltering;
      state.createdAssets = [];
    });
  },
  resetFilters: () => {
    set((state) => {
      const view = state.activeViewId && state.views[state.activeViewId];
      if (view) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        state.filters = view.filters ?? null;
        state.isFiltering = view.enableFiltering ?? false;
      } else {
        state.filters = null;
        state.isFiltering = false;
      }
    });
  },
  setSearch: (search) => {
    set((state) => {
      state.search = search;
      if (!search) {
        state.searchResults = [];
        state.searchResultsVSphere = [];
        return;
      }

      const lower = search.toLowerCase();

      const damerauLevenshtein = (a: string, b: string): number => {
        const n = a.length;
        const m = b.length;
        if (n === 0) return m;
        if (m === 0) return n;
        const dp: number[][] = Array.from({ length: n + 1 }, (_, i) =>
          Array.from({ length: m + 1 }, (_, j) =>
            i === 0 ? j : j === 0 ? i : 0,
          ),
        );
        for (let i = 1; i <= n; i++) {
          for (let j = 1; j <= m; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            const row = dp[i];
            const prevRow = dp[i - 1];
            if (!row || !prevRow) continue;
            row[j] = Math.min(
              (prevRow[j] ?? 0) + 1,
              (row[j - 1] ?? 0) + 1,
              (prevRow[j - 1] ?? 0) + cost,
            );
            if (
              i > 1 &&
              j > 1 &&
              a[i - 1] === b[j - 2] &&
              a[i - 2] === b[j - 1]
            ) {
              row[j] = Math.min(row[j] ?? 0, (dp[i - 2]?.[j - 2] ?? 0) + 1);
            }
          }
        }
        return dp[n]?.[m] ?? 0;
      };

      const baseSim = (s: string): number => {
        if (!s) return 0;
        if (s === lower) return 1;
        if (s.includes(lower)) {
          const pos = s.indexOf(lower);

          const lenPenalty =
            Math.abs(s.length - lower.length) /
            Math.max(s.length, lower.length);
          const posBonus = 1 - Math.min(pos / Math.max(1, s.length), 0.9);
          return Math.max(
            0.6,
            0.9 * (1 - 0.4 * lenPenalty) * (0.7 + 0.3 * posBonus),
          );
        }
        const dist = damerauLevenshtein(s, lower);
        const sim = 1 - dist / Math.max(s.length, lower.length);
        return Math.max(0, sim);
      };

      const textScore = (val: string): number => {
        const s = String(val).toLowerCase().trim();
        if (!s) return 0;
        const tokens = s.split(/[\s._\-:/\\]+/).filter(Boolean);
        const tokenBest = tokens.length ? Math.max(...tokens.map(baseSim)) : 0;
        return Math.max(baseSim(s), tokenBest);
      };

      const upsertBest = <T extends string>(
        arr: { id: T; score: number }[],
        id: T,
        score: number,
      ) => {
        const existing = arr.find((x) => x.id === id);
        if (!existing) arr.push({ id, score });
        else if (score > existing.score) existing.score = score;
      };

      const assetCandidates: { id: Id<"assets">; score: number }[] = [];
      const vmCandidates: { vm: IndexedVM; score: number }[] = [];

      for (const asset of Object.values(state.assets)) {
        let bestScore = 0;

        const boost = (score: number, weight: number) =>
          Math.min(1, score * weight);

        for (const [key, v] of Object.entries(asset.asset.metadata ?? {})) {
          const base = textScore(String(v));
          let weight = 1;

          if (key === state.magicFields.magic__hostname) {
            weight = 1.1;
          } else if (key === state.magicFields.magic__ip) {
            weight = 1.1;
          } else {
            const field = Object.values(state.fields).find(
              (f) => f.field._id === key,
            );
            if (field && field.field.type === "markdown") {
              weight = 0.8;
            }
          }

          bestScore = Math.max(bestScore, boost(base, weight));
          if (bestScore >= 1) break;
        }

        if (bestScore < 1) {
          for (const [key, v] of Object.entries(
            asset.asset.vsphereMetadata ?? {},
          )) {
            const base = textScore(String(v));
            const k = key.toLowerCase();
            let weight = 1;

            if (k.includes("hostname") || k === "host" || k === "name") {
              weight = 1.1;
            } else if (k.includes("ip")) {
              weight = 1.1;
            } else if (
              k.includes("writeup") ||
              k.includes("note") ||
              k.includes("desc")
            ) {
              weight = 0.8;
            }

            bestScore = Math.max(bestScore, boost(base, weight));
            if (bestScore >= 1) break;
          }
        }

        if (bestScore >= 0.05) {
          upsertBest(assetCandidates, asset.asset._id, bestScore);
        }
      }

      for (const vm of state.indexedVMs) {
        const hostnameScore = vm.hostname ? textScore(vm.hostname) : 0;
        const ipScore = vm.ips?.length
          ? Math.max(...vm.ips.map((ip) => textScore(ip)))
          : 0;
        const guestScore = vm.guestOs ? textScore(vm.guestOs) : 0;
        let bestSnapsScore = 0;
        if (vm.snaps) {
          for (const snap of vm.snaps) {
            const snapScore = textScore(snap.name) * 0.8;
            bestSnapsScore = Math.max(bestSnapsScore, snapScore);
            if (bestSnapsScore >= 1) break;
          }
        }

        const score = Math.max(
          hostnameScore * 1.0,
          ipScore * 0.9,
          guestScore * 0.7,
          bestSnapsScore * 0.7,
        );

        const hostnameField = state.magicFields.magic__hostname;
        const ipField = state.magicFields.magic__ip;

        if (hostnameField && ipField) {
          const asset = Object.values(state.assets).find(
            (a) =>
              (a.asset.metadata?.[hostnameField] &&
                a.asset.metadata[hostnameField] === vm.hostname) ??
              (a.asset.metadata?.[ipField] &&
                vm.ips?.includes(String(a.asset.metadata[ipField]))),
          );
          if (asset) {
            upsertBest(
              assetCandidates,
              asset.asset._id,
              Math.max(score * 0.98, 0.5),
            );
          }
        }

        vmCandidates.push({ vm, score });
      }

      assetCandidates.sort((a, b) => b.score - a.score);
      vmCandidates.sort((a, b) => b.score - a.score);

      const filteredAssetCandidates = assetCandidates.filter(
        (x) => x.score >= 0.5 || assetCandidates.indexOf(x) < 20,
      );
      const filteredVMCandidates = vmCandidates.filter(
        (x) => x.score >= 0.5 || vmCandidates.indexOf(x) < 20,
      );

      state.searchResults = filteredAssetCandidates.map((x) => x.id);
      state.searchResultsVSphere = filteredVMCandidates.map((x) => x.vm);
    });
  },
  setIndexedVMs: (vms) => {
    set((state) => {
      state.indexedVMs = vms;
    });
  },
});
