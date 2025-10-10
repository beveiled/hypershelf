import baseConfig, { restrictEnvAccess } from "@hypershelf/eslint-config/base";
import nextjsConfig from "@hypershelf/eslint-config/nextjs";
import reactConfig from "@hypershelf/eslint-config/react";

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: [".next/**"],
  },
  ...baseConfig,
  ...reactConfig,
  ...nextjsConfig,
  ...restrictEnvAccess,
  {
    rules: {
      "@typescript-eslint/triple-slash-reference": "off",
    },
  },
];
