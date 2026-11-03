import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { ESLint } from 'eslint';
import { test } from 'node:test';

const cwd = fileURLToPath(new URL('..', import.meta.url));
const eslint = new ESLint({ cwd });

async function messages(code, filePath = 'components/LintFixture.tsx') {
  const [result] = await eslint.lintText(code, { filePath });
  return result.messages;
}

test('lint accepts valid React TypeScript without a project-specific fixture file', async () => {
  assert.deepEqual(await messages('export function Greeting({name}: {name: string}) { return <p>{name}</p>; }'), []);
});

for (const [label, code, ruleId] of [
  ['React list keys', 'export function List() { return [1, 2].map(x => <span>{x}</span>); }', '@eslint-react/no-missing-key'],
  ['React Hooks', 'import {useState} from "react"; export function View({show}: {show: boolean}) { if (show) useState(0); return null; }', 'react-hooks/rules-of-hooks'],
  ['accessibility', 'export function Picture() { return <Image src="/test.png" />; }', 'jsx-a11y-x/alt-text'],
  ['Next image usage', 'export function Picture() { return <img alt="test" src="/test.png" />; }', '@next/next/no-img-element'],
  ['TypeScript', 'export const value: any = 1;', '@typescript-eslint/no-explicit-any'],
]) {
  test(`lint still detects invalid ${label}`, async () => {
    assert((await messages(code)).some((message) => message.ruleId === ruleId), ruleId);
  });
}

test('lint still checks anonymous JavaScript default exports', async () => {
  for (const code of ['export default {};', 'export default `text`;', 'export default new Date();']) {
    assert((await messages(code, 'scripts/lint-fixture.mjs'))
      .some((message) => message.ruleId === 'no-restricted-syntax'));
  }
});

test('React protections also apply to JavaScript components', async () => {
  const result = await messages('export function List() { return [1, 2].map(x => <span>{x}</span>); }', 'components/LintFixture.jsx');
  assert(result.some((message) => message.ruleId === '@eslint-react/no-missing-key'));
  const undefinedComponent = await messages('export function View() { return <Unknown />; }', 'components/LintFixture.jsx');
  assert(undefinedComponent.some((message) => message.ruleId === 'no-undef'));
});
