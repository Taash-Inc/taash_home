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

`npm run check` runs all five checks above and is shared by CI and the alias
update workflow. `npm test` also exercises the dependency automation guards.

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

Dependabot's npm version updater currently skips `npm:` aliases. The
[TypeScript alias update workflow](.github/workflows/typescript-alias-updates.yml)
covers that gap every Monday at 10:17 in `America/Chicago`, and can also be run
manually from Actions. It updates stable releases within TypeScript **7** and
the TypeScript **6** API compatibility package, preserving both aliases. Future
major migrations and prereleases require a deliberate change to the policy in
`scripts/update-typescript-aliases.mjs`.

The updater refreshes `package.json` and `package-lock.json`, installs with strict
peers, and runs `npm run check` before publishing an update PR. Installation and
checks run with read-only permissions; a separate job can push only after they
pass. It keeps one outstanding alias PR and never approves or merges updates.
No new personal access token or repository secret is needed. Repository Actions
settings must allow GitHub Actions to create PRs (GitHub combines creation and
approval in one setting). GitHub may ask a maintainer to approve the additional
normal PR workflow runs; the updater's full validation already runs automatically
and is linked in the PR. A manual workflow run validates everything even when
the aliases are current; scheduled runs skip installation/checks when unchanged.

For local use, run `npm run update:typescript`, `npm ci --strict-peer-deps`, and
`npm run check`. Registry errors, unexpected aliases, lockfile mismatches, and
downgrades fail the update instead of silently reporting success.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
