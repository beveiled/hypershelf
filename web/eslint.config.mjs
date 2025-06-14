import { FlatCompat } from "@eslint/eslintrc";
import importPlugin from "eslint-plugin-import";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript", "prettier"),
  {
    plugins: {
      import: importPlugin
    },
    settings: {
      "import/resolver": {
        typescript: {
          alwaysTryTypes: true,
          project: "./tsconfig.json"
        }
      }
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
            "**/storybook/**"
          ]
        }
      ]
    }
  }
];

export default eslintConfig;
