import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript", "prettier"),
  {
    rules: {
      indent: ["error", 2, { SwitchCase: 1 }],
      quotes: ["error", "double"],
      semi: ["error", "always"],
      "comma-dangle": ["error", "always-multiline"],
      "no-cond-assign": ["error", "always"],
      "no-trailing-spaces": "error",
      "no-multi-spaces": ["error", { ignoreEOLComments: true }],
      "max-len": ["error", { code: 150, tabWidth: 2 }],
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];

export default eslintConfig;
