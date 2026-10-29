This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
nvm install
nvm use
npm ci --strict-peer-deps
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load Space Grotesk and JetBrains Mono.

## Toolchain and checks

Use the Node version in `.nvmrc` and npm with the committed `package-lock.json`.
TypeScript 7 is installed as `@typescript/native` and provides `tsc`.
The `typescript` dependency aliases Microsoft's TypeScript 6 compatibility package,
which provides the compiler API needed by ESLint and the Next.js editor plugin.
ESLint stays on major 9 until its plugins officially support major 10.

```bash
npm run audit
npm run typecheck
npm run lint
npm test
npm run build
```

`typecheck` generates Next.js route types before running TypeScript 7. `build`
automatically runs this check through `prebuild`, including in deployment builds.
Next.js also runs its own check with the TypeScript 6 compatibility compiler.
Both checks must pass; build type errors remain enabled. Editor integrations
that require the JavaScript compiler API can continue using the workspace
`typescript` package.

See the [dependency upgrade record](docs/dependency-upgrades-2026-10-28.md) for
versions, compatibility decisions, and verification results.

## Dependency update PRs

[Dependabot](.github/dependabot.yml) checks npm dependencies every Monday at
09:00 and GitHub Actions at 09:30, both in `America/Chicago`. Minor and patch npm
updates are grouped; major npm updates remain separate. Action updates are
grouped and keep the existing commit SHA pins. Update PRs run the normal CI
checks and remain for manual review and merging.

ESLint 10 and newer are ignored while the app uses ESLint 9. Remove that ignore
rule only after `eslint-plugin-react`, `eslint-plugin-jsx-a11y`, and
`eslint-plugin-import` officially support ESLint 10. Dependabot does not
automatically remove this hold. Node type major updates are also held so they
can be reviewed alongside a Node runtime upgrade.

Dependabot's npm version updater currently skips `npm:` aliases. The TypeScript
aliases (`@typescript/native` and `typescript`) therefore need manual updates.
Preserve both aliases and run the checks above when updating them. This is an
[upstream updater limitation](https://github.com/dependabot/dependabot-core/blob/main/npm_and_yarn/lib/dependabot/npm_and_yarn/file_parser.rb).

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
