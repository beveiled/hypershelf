import { FlatCompat } from "@eslint/eslintrc";
import importPlugin from "eslint-plugin-import";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const compat = new FlatCompat({ baseDirectory: __dirname });
const rootPkgDir = __dirname;

const eslintConfig = [
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "convex/_generated/**",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript", "prettier"),
  {
    plugins: { import: importPlugin },
    settings: {
      "import/resolver": {
        typescript: {
          alwaysTryTypes: true,
          project: ["./tsconfig.json", "plugins/*/tsconfig.json"],
        },
        alias: {
          map: [["@", "./"]],
          extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
        },
      },
      "import/internal-regex": "^@/",
    },
    rules: {
      "import/no-extraneous-dependencies": [
        "error",
        {
          devDependencies: [
            "**/*.test.{js,ts,tsx}",
            "**/*.spec.{js,ts,tsx}",
            "**/*.stories.{js,ts,tsx}",
            "**/tests/**",
            "**/storybook/**",
          ],
          packageDir: [rootPkgDir],
        },
      ],
    },
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.json", "plugins/*/tsconfig.json"],
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-deprecated": "error",
      quotes: ["error", "double", { avoidEscape: true }],
    },
  },
];

export default eslintConfig;
