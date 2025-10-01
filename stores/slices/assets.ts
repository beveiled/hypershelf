import { Id } from "@/convex/_generated/dataModel";
import { AssetType, ExtendedAssetType } from "@/convex/schema";
import { assetsEqual } from "@/lib/utils";
import { AssetsSlice, ImmerStateCreator } from "../types";
import { isEqual } from "lodash";

export const assetsSlice: ImmerStateCreator<AssetsSlice> = (set, get) => ({
  revalidateLocks: () =>
    set(state => {
      if (!state.viewer) {
        console.warn("Refusing to revalidate locks without viewer");
        return;
      }
      for (const [, asset] of Object.entries(state.assets)) {
        if (!asset.locks) continue;
        if (!state.lockedFields[asset.asset._id]) {
          state.lockedFields[asset.asset._id] = {};
        }
        for (const lock of asset.locks) {
          if (
            state.lockedFields[asset.asset._id][lock.fieldId] !==
              (lock.holder?.email || "Кто-то") &&
            lock.holder?.id !== state.viewer
          ) {
            state.lockedFields[asset.asset._id][lock.fieldId] =
              lock.holder?.email || "Кто-то";
          }
        }
        for (const fieldId of Object.keys(
          state.lockedFields[asset.asset._id],
        )) {
          if (
            !asset.locks.some(lock => lock.fieldId === fieldId) &&
            state.lockedFields[asset.asset._id][fieldId as Id<"fields">]
          ) {
            delete state.lockedFields[asset.asset._id][fieldId as Id<"fields">];
          }
        }
      }
    }),
  setAssets: incoming => {
    set(state => {
      for (const [id, asset] of Object.entries(incoming) as [
        Id<"assets">,
        ExtendedAssetType,
      ][]) {
        if (!!state.assets[id] && assetsEqual(state.assets[id], asset))
          continue;
        if (!state.assetIds.includes(id)) {
          state.assetIds.push(id);
        }

        if (!state.assets[id]) {
          state.assets[id] = asset;
        } else {
          if (!isEqual(asset.locks, state.assets[id].locks)) {
            state.assets[id].locks = asset.locks;
          }
          if (
            asset.asset.vsphereLastSync !==
            state.assets[id].asset.vsphereLastSync
          ) {
            state.assets[id].asset.vsphereLastSync =
              asset.asset.vsphereLastSync;
          }
          if (asset.asset.vsphereMoid !== state.assets[id].asset.vsphereMoid) {
            state.assets[id].asset.vsphereMoid = asset.asset.vsphereMoid;
          }
          if (asset.asset.metadata) {
            const prevKeys = Object.keys(
              state.assets[id].asset.metadata || {},
            ) as (keyof AssetType["metadata"])[];
            const newKeys = Object.keys(
              asset.asset.metadata || {},
            ) as (keyof AssetType["metadata"])[];
            for (const key of prevKeys) {
              if (!newKeys.includes(key)) {
                delete state.assets[id].asset.metadata?.[key];
              }
            }
            if (!state.assets[id].asset.metadata)
              state.assets[id].asset.metadata = {};
            for (const key of newKeys) {
              if (!prevKeys.includes(key)) {
                state.assets[id].asset.metadata[key] =
                  asset.asset.metadata[key];
              } else if (
                !isEqual(
                  state.assets[id].asset.metadata[key],
                  asset.asset.metadata[key],
                )
              ) {
                state.assets[id].asset.metadata[key] =
                  asset.asset.metadata[key];
              }
            }
          }
          if (asset.asset.vsphereMetadata) {
            const prevKeys = Object.keys(
              state.assets[id].asset.vsphereMetadata || {},
            ) as (keyof AssetType["vsphereMetadata"])[];
            const newKeys = Object.keys(
              asset.asset.vsphereMetadata || {},
            ) as (keyof AssetType["vsphereMetadata"])[];
            for (const key of prevKeys) {
              if (!newKeys.includes(key)) {
                delete state.assets[id].asset.vsphereMetadata?.[key];
              }
            }
            if (!state.assets[id].asset.vsphereMetadata)
              state.assets[id].asset.vsphereMetadata = {};
            for (const key of newKeys) {
              if (!prevKeys.includes(key)) {
                state.assets[id].asset.vsphereMetadata[key] =
                  asset.asset.vsphereMetadata[key];
              } else if (
                !isEqual(
                  state.assets[id].asset.vsphereMetadata[key],
                  asset.asset.vsphereMetadata[key],
                )
              ) {
                state.assets[id].asset.vsphereMetadata[key] =
                  asset.asset.vsphereMetadata[key];
              }
            }
          }
        }
      }
      for (const id of state.assetIds) {
        if (!incoming[id]) {
          delete state.assets[id];
          delete state.assetErrors[id];
          delete state.lockedFields[id];
          state.assetIds.splice(state.assetIds.indexOf(id), 1);
        }
      }
    });
    get().revalidateErrors();
    get().revalidateLocks();
    set(state => {
      if (state.loadingAssets) state.loadingAssets = false;
    });
  },
  setAssetsLocker: locker =>
    set(state => {
      state.assetsLocker = locker;
    }),
  lookupAsset: ({ hostname, ip }) => {
    const state = get();
    if (hostname) {
      const fieldId = state.magicFields?.["magic__hostname"];
      const byHostname =
        fieldId &&
        Object.values(state.assets).find(
          a => a.asset.metadata?.[fieldId] === hostname,
        );
      if (byHostname) return byHostname;
    }
    if (ip) {
      const fieldId = state.magicFields?.["magic__ip"];
      const byIP =
        fieldId &&
        Object.values(state.assets).find(
          a => a.asset.metadata?.[fieldId] === ip,
        );
      if (byIP) return byIP;
    }
    return undefined;
  },
});
