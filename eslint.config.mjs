import { defineConfig, globalIgnores } from "eslint/config";
import next from "@next/eslint-plugin-next";
import react from "@eslint-react/eslint-plugin";
import hooks from "eslint-plugin-react-hooks";
import a11y from "eslint-plugin-jsx-a11y-x";
import globals from "globals";
import tseslint from "typescript-eslint";

const eslintConfig = defineConfig([
  {
    files: ["**/*.{js,jsx,mjs,cjs}"],
    extends: [react.configs.recommended],
    languageOptions: { parser: tseslint.parser },
    rules: { "no-undef": "error" },
  },
  {
    files: ["**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}"],
    plugins: {
      "@next/next": next,
      "react-hooks": hooks,
      "jsx-a11y-x": a11y,
    },
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      ...next.configs.recommended.rules,
      ...next.configs["core-web-vitals"].rules,
      ...hooks.configs.recommended.rules,
      "no-restricted-syntax": [
        "warn",
        {
          selector: "ExportDefaultDeclaration > :matches(ArrayExpression, ArrowFunctionExpression, Literal, TemplateLiteral, NewExpression, ObjectExpression)",
          message: "Assign the default export to a named variable first.",
        },
        {
          selector: "ExportDefaultDeclaration > :matches(ClassDeclaration, FunctionDeclaration)[id=null]",
          message: "Give the default-exported class or function a name.",
        },
      ],
      "jsx-a11y-x/alt-text": ["warn", { elements: ["img"], img: ["Image"] }],
      "jsx-a11y-x/aria-props": "warn",
      "jsx-a11y-x/aria-proptypes": "warn",
      "jsx-a11y-x/aria-unsupported-elements": "warn",
      "jsx-a11y-x/role-has-required-aria-props": "warn",
      "jsx-a11y-x/role-supports-aria-props": "warn",
    },
  },
  {
    files: ["**/*.{ts,tsx,mts,cts}"],
    extends: [tseslint.configs.recommended, react.configs["recommended-typescript"]],
    rules: {
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-unused-expressions": "warn",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
