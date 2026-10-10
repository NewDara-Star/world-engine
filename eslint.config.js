import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["node_modules/", "research/", ".claude/.state/"] },
  js.configs.recommended,
  ...tseslint.configs.strict,
  {
    rules: {
      // CLAUDE.md "Small functions": a function should read as a diagram.
      "max-lines-per-function": ["error", { max: 30, skipBlankLines: true, skipComments: true }],
      complexity: ["error", 8],
      // CLAUDE.md "Names say what things are": a new name may not hide an old one.
      "no-shadow": "error",
    },
  },
  {
    // Tests are long tables of cases; the size rule is for engine code.
    files: ["tests/**/*.ts"],
    rules: { "max-lines-per-function": "off" },
  },
);
