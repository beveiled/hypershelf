import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    REDIS_URL: z.string(),
    REDIS_PASSWORD: z.string(),
    VSPHERE_HOSTNAME: z.string(),
    VSPHERE_LOGIN: z.string(),
    VSPHERE_PASSWORD: z.string(),
    USE_MOCKS: z.boolean().default(false),
    VSPHERE_TOPOLOGY_ROOT_MOID: z.string(),
  },
  client: {},
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    REDIS_URL: process.env.REDIS_URL,
    REDIS_PASSWORD: process.env.REDIS_PASSWORD,
    VSPHERE_HOSTNAME: process.env.VSPHERE_HOSTNAME,
    VSPHERE_LOGIN: process.env.VSPHERE_LOGIN,
    VSPHERE_PASSWORD: process.env.VSPHERE_PASSWORD,
    USE_MOCKS: process.env.USE_MOCKS === "true",
    VSPHERE_TOPOLOGY_ROOT_MOID: process.env.VSPHERE_TOPOLOGY_ROOT_MOID,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
