import baseConfig, { restrictEnvAccess } from "@hypershelf/eslint-config/base";
import reactConfig from "@hypershelf/eslint-config/react";

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: [".next/**", "dist/**"],
  },
  ...baseConfig,
  ...reactConfig,
  ...restrictEnvAccess,
];
