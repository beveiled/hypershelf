import type { FolderTree } from "@hypershelf/convex/lib/integrations/vsphere";

import type { Link } from "../../types";
import type { ImmerStateCreator, SchemasSlice } from "../types";

export const schemasSlice: ImmerStateCreator<SchemasSlice> = (set, get) => ({
  updateTopology: (incoming) => {
    set((state) => {
      state.routers = incoming.routers;
      state.vms = incoming.vms;
      state.topologyFetchTime = incoming.fetchTime;
    });
  },
  updateNetworkTopology: (network) => {
    try {
      const links: Link[] = [];
      const existingVms = get().vms;
      const vms = network.hosts
        .map((h) => {
          return existingVms.find((v) => v.hostname === h.hostname);
        })
        .filter((v): v is NonNullable<typeof v> => !!v);
      const hostMap = new Map(network.hosts.map((h) => [h.id, h]));
      const addedLinks = new Set<string>();

      for (const host of network.hosts) {
        for (const neighbor of host.neighbors) {
          const neighborHost = hostMap.get(neighbor.id);

          if (!neighborHost) {
            continue;
          }

          if (host.id === neighborHost.id) {
            continue;
          }

          const fromVm = vms.find((v) => v.hostname === host.hostname);
          const toVm = vms.find((v) => v.hostname === neighborHost.hostname);
          if (!fromVm || !toVm || fromVm.parent === toVm.parent) {
            continue;
          }

          const linkId = [fromVm.id, toVm.id].sort().join("-");
          if (!addedLinks.has(linkId)) {
            links.push({
              from: fromVm.id,
              to: toVm.id,
              label: neighbor.attributes?.map((a) => String(a)) ?? [],
            });
            addedLinks.add(linkId);
          }
        }
      }
      set((state) => {
        state.links = links;
      });
    } catch (error) {
      console.error("Failed to update network topology:", error);
      return;
    }
  },
  toggleVmNodeNetworkTopologyView: (vmId, newState = undefined) => {
    set((state) => {
      if (typeof newState === "boolean") {
        if (newState) {
          state.selectedVmNodesNetworkTopologyView[vmId] = true;
        } else {
          delete state.selectedVmNodesNetworkTopologyView[vmId];
        }
        return;
      }
      if (
        !state.vms.some((v) => !state.selectedVmNodesNetworkTopologyView[v.id])
      ) {
        state.selectedVmNodesNetworkTopologyView = {};
      }
      if (state.selectedVmNodesNetworkTopologyView[vmId]) {
        delete state.selectedVmNodesNetworkTopologyView[vmId];
      } else {
        state.selectedVmNodesNetworkTopologyView[vmId] = true;
      }
    });
  },
  setFolderTree: (tree) => {
    set((state) => {
      state.folderTree = tree;
      if (state.rootMoid) {
        const exists = (function checkExists(node: FolderTree): boolean {
          if (node.id === state.rootMoid) return true;
          for (const child of node.children) {
            if (checkExists(child)) return true;
          }
          return false;
        })(tree);
        if (!exists) {
          state.rootMoid = null;
          localStorage.removeItem("rootMoid");
        }
      }
    });
  },
  setFolderTreeLoaded: (loaded) => {
    set((state) => {
      state.folderTreeLoaded = loaded;
    });
  },
  setRootMoid: (rootMoid) => {
    set((state) => {
      state.rootMoid = rootMoid;
      const url = new URL(window.location.href);
      url.searchParams.set("rootMoid", rootMoid);
      window.history.replaceState({}, "", url);
    });
  },
  setHighlightLink: (link) => {
    set((state) => {
      state.highlightLink = link;
    });
  },
});
