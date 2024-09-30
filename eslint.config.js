import { defineConfig } from "eslint-define-config";

export default defineConfig([
  {
    languageOptions: {
      globals: {
        console: "readonly",
      },
    },
    rules: {
      "no-console": ["warn", { allow: ["warn"] }],
      "prefer-const": "error",
      semi: ["error", "always"],
      curly: ["error", "all"],
      eqeqeq: ["error", "always"],
      "no-multi-spaces": ["error"],
      "no-duplicate-imports": ["error"],
    },
    ignores: ["mochawesome-report/**"],
  },
]);
