# ESLint 10 migration — November 3, 2026

The application security change includes the approved lint migration needed to
resolve the minimatch development dependency advisory. ESLint 9's legacy React,
accessibility and import plugins still require its old API; forcing the old bundle
onto ESLint 10 would violate peers and break glob matching.

## Final toolchain

- ESLint 10.14.0 and the existing Next.js 16.4.3 plugin, configured directly.
- ESLint React 5.28.8 for React and DOM rules, including JavaScript/JSX files.
- React Hooks 7.1.1, preserving the official compiler and Hooks rule set.
- jsx-a11y-x 0.2.0, preserving the six accessibility checks previously configured
  by Next, including the custom `Image` mapping for alt text.
- typescript-eslint 8.72.1 with the existing TypeScript 6 compiler API alias.
- A minimatch `^11.0.1` override, resolved to 11.0.4. Remaining consumers use
  the modern matcher API; the full file traversal and lint fixtures exercise it.

Node remains pinned to 22.23.4. The package engine range now reflects ESLint 10's
minimum supported Node 22 version and its Node 24+ support.

The legacy `eslint-config-next`, `eslint-plugin-react`, `eslint-plugin-jsx-a11y`
and `eslint-plugin-import` chain is removed. Next's old configuration enabled
only one import style rule: no anonymous default exports. ESLint core AST selectors
preserve its anonymous value/class/function, template literal and `new` cases;
named default exports and wrapper calls remain allowed. This avoids importing a
replacement import plugin that still requires minimatch's removed `makeRe` API.

The React migration uses recommended presets for JS/JSX and TS. JavaScript files
use the TypeScript parser's JSX scope analysis with core `no-undef`, so undefined
JSX components remain detectable. Existing TypeScript, React Hooks, Next core web
vitals, accessibility and anonymous-export rules retain their configured checks.
Recommended React checks introduce 19 nonblocking warnings in existing code;
the migration does not suppress them or change product components to clear them.

The old Dependabot ESLint-major hold is removed. Future lint changes must pass
`scripts/lint-config.test.mjs`, which exercises valid TSX and invalid React keys,
Hooks, accessibility, Next image usage, TypeScript, anonymous exports and JS/JSX
component references against the actual installed configuration.

## Validation

- Clean `npm ci --ignore-scripts --strict-peer-deps` on Node 22.23.4 passed.
- Full npm audit: zero advisories. No severity filtering or advisory exceptions.
- Native TypeScript 7/type generation and the Next TypeScript 6 build check passed.
- ESLint: zero errors; the 19 new preset warnings noted above are nonblocking.
- All 128 tests passed: 103 Vitest and 25 native Node tests.
- Production build and local HTTP security-header/denial smoke checks passed.
- Runtime direct dependency versions are unchanged. Peer inspection found no
  invalid or missing peers; npm reported two extraneous optional WASM artifacts
  (`@emnapi/runtime` and `@img/sharp-wasm32`) in the scripts-disabled installation.

Relevant references: [ESLint 10 migration](https://eslint.org/docs/latest/use/migrate-to-10.0.0),
[ESLint React setup](https://eslint-react.xyz/docs/getting-started/typescript),
[jsx-a11y-x migration](https://github.com/eslint-community/eslint-plugin-jsx-a11y-x#readme),
[minimatch advisory](https://github.com/isaacs/minimatch/security/advisories/GHSA-g3hv-75wg-m249).
