import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { vsphereRouter } from "./routers/vsphere";

export const appRouter = createTRPCRouter({
  vsphere: vsphereRouter,
});

export type AppRouter = typeof appRouter;
export const createCaller = createCallerFactory(appRouter);
