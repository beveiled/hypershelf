import {
  Router,
  VM,
  fetchTopology,
  fetchTopologyStructure,
} from "@/lib/integrations/vsphere";
import { FolderTree } from "@/lib/integrations/vsphere/types";
import { env } from "@/env";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { NetworkTopology } from "@/stores/types";
import { TRPCError } from "@trpc/server";
import z from "zod";

export const vsphereRouter = createTRPCRouter({
  fetchTopology: protectedProcedure
    .input(
      z.object({
        rootMoid: z.string(),
        force: z.boolean().optional(),
      }),
    )
    .query(
      async ({
        ctx,
        input,
      }): Promise<{
        routers: Router[];
        vms: VM[];
        fetchTime: string;
        cached: boolean;
      }> => {
        if (env.USE_MOCKS) {
          console.warn("Using mock data for vSphere topology");
          await new Promise(resolve => setTimeout(resolve, 5000));
          const topology = (
            await import("../../../lib/mocks/vsphere-topology.json")
          ).default;
          return {
            routers: topology.routers,
            vms: topology.vms,
            cached: false,
            fetchTime: new Date().toISOString(),
          };
        }
        const cacheKey = `topology:${input.rootMoid}`;
        const cachedData = await ctx.redis.get(cacheKey);
        if (cachedData && !input.force) {
          return {
            ...(JSON.parse(cachedData) as Awaited<
              ReturnType<typeof fetchTopology>
            > & {
              fetchTime: string;
            }),
            cached: true,
          };
        }

        const topology = {
          ...(await fetchTopology(input.rootMoid, ctx.redis)),
          fetchTime: new Date().toISOString(),
        };
        await ctx.redis.set(cacheKey, JSON.stringify(topology), {
          EX: 3 * 60,
        });
        return {
          ...topology,
          cached: false,
        };
      },
    ),
  fetchNetworkTopology: protectedProcedure.query(
    async ({ ctx }): Promise<NetworkTopology | null> => {
      const networkTopologyRaw = await ctx.redis.get("network-topology");
      if (!networkTopologyRaw || env.USE_MOCKS) {
        console.warn("Using mock data for network topology");
        return (await import("../../../lib/mocks/network-topology.json"))
          .default;
      } else {
        return JSON.parse(networkTopologyRaw);
      }
    },
  ),
  uploadNetworkTopology: protectedProcedure
    .input(
      z.object({
        data: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const parsed = JSON.parse(input.data) as unknown;

        if (typeof parsed !== "object" || parsed === null) {
          throw new Error("Invalid topology format: root must be an object.");
        }

        if (!("hosts" in parsed) || !Array.isArray(parsed.hosts)) {
          throw new Error(
            "Invalid topology format: 'hosts' property is missing or not an array.",
          );
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Invalid JSON format";
        throw new TRPCError({
          code: "BAD_REQUEST",
          message,
          cause: error,
        });
      }
      const selectedData = JSON.stringify({
        hosts: (JSON.parse(input.data) as NetworkTopology).hosts
          .map(h => {
            if (typeof h !== "object" || h === null) {
              return;
            }
            if (!("id" in h) || typeof h.id !== "string") {
              return;
            }
            if (!("hostname" in h) || typeof h.hostname !== "string") {
              return;
            }
            if ("neighbors" in h && h.neighbors) {
              if (!Array.isArray(h.neighbors)) {
                return;
              }
              for (const n of h.neighbors) {
                if (typeof n !== "object" || n === null) {
                  return;
                }
                if (!("id" in n) || typeof n.id !== "string") {
                  return;
                }
              }
            }
            return {
              id: h.id,
              hostname: h.hostname,
              neighbors: h.neighbors
                ? h.neighbors.map(n => ({ id: n.id }))
                : [],
            };
          })
          .filter(h => h !== undefined),
      });
      await ctx.redis.set("network-topology", selectedData);
      return { success: true };
    }),
  fetchTopologyStructure: protectedProcedure.query(
    async ({
      ctx,
    }): Promise<{
      structure: FolderTree;
      fetchTime: string;
    }> => {
      if (env.USE_MOCKS) {
        console.warn("Using mock data for vSphere topology structure");
        await new Promise(resolve => setTimeout(resolve, 2000));
        return {
          structure: (
            await import("../../../lib/mocks/vsphere-topology-structure.json")
          ).default,
          fetchTime: new Date().toISOString(),
        };
      }
      const rootMoid = env.VSPHERE_TOPOLOGY_ROOT_MOID;
      if (!rootMoid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "VSPHERE_TOPOLOGY_ROOT_MOID is not set",
        });
      }
      const cacheKey = `topology-structure:${rootMoid}`;
      const cachedData = await ctx.redis.get(cacheKey);
      if (cachedData) {
        return JSON.parse(cachedData);
      }

      const topology = {
        structure: await fetchTopologyStructure(rootMoid, ctx.redis),
        fetchTime: new Date().toISOString(),
      };
      await ctx.redis.set(cacheKey, JSON.stringify(topology), {
        EX: 10 * 60 * 60,
      });
      return topology;
    },
  ),
});
