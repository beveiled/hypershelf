"use node";

import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    REDIS_URL: z.string(),
    REDIS_PASSWORD: z.string(),
    VSPHERE_HOSTNAME: z.string(),
    VSPHERE_LOGIN: z.string(),
    VSPHERE_PASSWORD: z.string(),
    VSPHERE_TOPOLOGY_ROOT_MOID: z.string(),
  },
  client: {},
  runtimeEnv: {
    REDIS_URL: process.env.REDIS_URL,
    REDIS_PASSWORD: process.env.REDIS_PASSWORD,
    VSPHERE_HOSTNAME: process.env.VSPHERE_HOSTNAME,
    VSPHERE_LOGIN: process.env.VSPHERE_LOGIN,
    VSPHERE_PASSWORD: process.env.VSPHERE_PASSWORD,
    VSPHERE_TOPOLOGY_ROOT_MOID: process.env.VSPHERE_TOPOLOGY_ROOT_MOID,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
