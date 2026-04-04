import js from "@eslint/js";
import globals from "globals";

export default [
  {
    ignores: ["node_modules/**"],
  },
  js.configs.recommended,
  {
    files: ["scripts/**/*.mjs"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.node,
      sourceType: "module",
    },
  },
];
