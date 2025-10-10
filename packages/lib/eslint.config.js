import baseConfig, { restrictEnvAccess } from "@hypershelf/eslint-config/base";

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: [".next/**"],
  },
  ...baseConfig,
  ...restrictEnvAccess,
];
