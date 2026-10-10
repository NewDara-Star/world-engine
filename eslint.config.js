import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["node_modules/", "research/", ".claude/.state/"] },
  js.configs.recommended,
  ...tseslint.configs.strict,
  {
    rules: {
      // CLAUDE.md "Small functions": a function should read as a diagram, so
      // we limit how many paths run through it and how deep it nests, not how
      // long it is. Length is only a safety net against a pasted wall of code.
      complexity: ["error", 8],
      "max-depth": ["error", 3],
      "max-lines-per-function": ["error", { max: 120, skipBlankLines: true, skipComments: true }],
      // CLAUDE.md "Names say what things are": a new name may not hide an old one.
      "no-shadow": "error",
    },
  },
  {
    // Tests are long tables of cases; the length net is for engine code.
    files: ["tests/**/*.ts"],
    rules: { "max-lines-per-function": "off" },
  },
);
