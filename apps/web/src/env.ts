import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    VSPHERE_HOSTNAME: z.string(),
    VSPHERE_LOGIN: z.string(),
    VSPHERE_PASSWORD: z.string(),
  },
  client: {
    NEXT_PUBLIC_CONVEX_URL: z.string(),
    NEXT_PUBLIC_VERSION: z.string(),
    NEXT_PUBLIC_VERSION_MOD: z.string(),
    NEXT_PUBLIC_SITE_URL: z.string().optional(),
  },
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    VSPHERE_HOSTNAME: process.env.VSPHERE_HOSTNAME,
    VSPHERE_LOGIN: process.env.VSPHERE_LOGIN,
    VSPHERE_PASSWORD: process.env.VSPHERE_PASSWORD,
    NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL,
    NEXT_PUBLIC_VERSION: process.env.NEXT_PUBLIC_VERSION,
    NEXT_PUBLIC_VERSION_MOD: process.env.NEXT_PUBLIC_VERSION_MOD,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
