import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [".output/**", ".wxt/**", "node_modules/**", "dist/**"]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        chrome: "readonly",
        defineBackground: "readonly",
        defineContentScript: "readonly"
      }
    },
    rules: {
      "no-console": ["error", { "allow": ["warn", "error"] }],
      "@typescript-eslint/no-explicit-any": "error"
    }
  }
);
