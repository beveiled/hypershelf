import baseConfig from "@hypershelf/eslint-config/base";

/** @type {import('typescript-eslint').Config} */
export default [
  ...baseConfig,
  {
    ignores: ["node_modules/**", "_generated/**"],
  },
  {
    rules: {
      "turbo/no-undeclared-env-vars": "off",
    },
  },
];
