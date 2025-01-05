// @ts-check
import js  from "@eslint/js";
import ts  from "typescript-eslint";
import ix  from "eslint-plugin-import-x";
import pth from "node:path";

export default ts.config(
  // Parsing configuration
  {
    settings: {
      resolver: "typescript"
    },
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: pth.resolve(import.meta.dirname,"..")
      },
    }
  },
  // Global rules
  {
    files: ["**/*.{ts,mts,cts}"],
    ignores: ["**/*.d.ts"],
    extends: [
      js.configs.recommended,
      ix.flatConfigs.recommended,
      ix.flatConfigs.typescript,
      ts.configs.strictTypeChecked,
    ],
    rules: {
      "no-control-regex": "off",
      "@typescript-eslint/restrict-template-expressions": ["error", { allowNumber: true }]
    }
  },
  // Rules for tests
  {
    files: ["**/test/*.{ts,mts,cts}"],
    rules: {
      "@typescript-eslint/no-floating-promises": "off"
    }
  }
);