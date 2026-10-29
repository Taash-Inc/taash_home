import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { aliases, latestStable, readState, verifyCandidate } from './update-typescript-aliases.mjs';

const script = fileURLToPath(new URL('./update-typescript-aliases.mjs', import.meta.url));

function fixture(t) {
  const directory = mkdtempSync(join(tmpdir(), 'taash-ts-aliases-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const manifest = {
    name: 'fixture', scripts: { typecheck: 'tsc --noEmit' },
    devDependencies: {
      '@typescript/native': 'npm:typescript@^7.0.2',
      typescript: 'npm:@typescript/typescript6@^6.0.2', eslint: '^9.39.5',
    },
  };
  const lock = { lockfileVersion: 3, packages: {
    '': { name: manifest.name, devDependencies: { ...manifest.devDependencies } },
    'node_modules/@typescript/native': { name: 'typescript', version: '7.0.2' },
    'node_modules/typescript': { name: '@typescript/typescript6', version: '6.0.2' },
  } };
  const save = () => {
    writeFileSync(join(directory, 'package.json'), `${JSON.stringify(manifest, null, 2)}\n`);
    writeFileSync(join(directory, 'package-lock.json'), `${JSON.stringify(lock, null, 2)}\n`);
  };
  save();
  return { directory, manifest, lock, save };
}

function mockNpm(directory, metadata, mode = 'ok') {
  mkdirSync(join(directory, 'bin'));
  writeFileSync(join(directory, 'metadata.json'), JSON.stringify(metadata));
  writeFileSync(join(directory, 'bin/npm'), `#!/usr/bin/env node
const fs = require('node:fs');
const args = process.argv.slice(2);
fs.appendFileSync('npm-calls.jsonl', JSON.stringify(args) + '\\n');
if (args[0] === 'view') {
  if (${JSON.stringify(mode)} === 'registry-failure') process.exit(1);
  console.log(JSON.stringify(JSON.parse(fs.readFileSync('metadata.json'))[args[1]]));
} else if (args[0] === 'install') {
  const manifest = JSON.parse(fs.readFileSync('package.json'));
  const lock = JSON.parse(fs.readFileSync('package-lock.json'));
  for (const name of ['@typescript/native', 'typescript']) {
    const spec = manifest.devDependencies[name];
    lock.packages[''].devDependencies[name] = spec;
    lock.packages['node_modules/' + name].version = spec.split('^')[1];
  }
  if (${JSON.stringify(mode)} === 'wrong-resolution') lock.packages['node_modules/typescript'].version = '6.9.0';
  fs.writeFileSync('package-lock.json', JSON.stringify(lock));
  if (${JSON.stringify(mode)} === 'install-failure') process.exit(1);
} else process.exit(2);
`, { mode: 0o755 });
}

function run(directory, args = []) {
  const env = { ...process.env, PATH: `${join(directory, 'bin')}${delimiter}${process.env.PATH}` };
  // Keep fixtures from writing outputs into the parent GitHub Actions step.
  delete env.GITHUB_OUTPUT;
  return spawnSync(process.execPath, [script, ...args], { cwd: directory, env, encoding: 'utf8' });
}

const updates = { 'typescript@7': ['7.0.2', '7.1.0'], '@typescript/typescript6@6': ['6.0.2', '6.0.3'] };

test('selects numeric stable releases within the approved major', () => {
  assert.equal(latestStable(['8.0.0', '7.9.0', '7.10.0', '7.11.0-rc.1'], 7), '7.10.0');
  assert.equal(latestStable('6.0.2', 6), '6.0.2');
  for (const bad of [null, true, NaN, Infinity, -1, 0, '', [], {}, [null], ['garbage'], ['7.0'],
    ['07.0.0'], ['9007199254740992.0.0'], ['8.0.0'], ['7.1.0-rc.1']]) {
    assert.throws(() => latestStable(bad, 7));
  }
});

test('missing, empty, malformed, or incompatible manifests and locks fail', t => {
  const f = fixture(t);
  for (const file of ['package.json', 'package-lock.json']) {
    const path = join(f.directory, file);
    rmSync(path);
    assert.throws(() => readState(f.directory));
    for (const contents of ['', '{', 'null', '{}', '[]', 'true']) {
      writeFileSync(path, contents);
      assert.throws(() => readState(f.directory));
    }
    f.save();
  }
  f.manifest.devDependencies.typescript = '^7.0.2';
  f.save();
  assert.throws(() => readState(f.directory), /Unexpected alias/);
  f.manifest.devDependencies.typescript = 'npm:@typescript/typescript6@^7.0.2';
  f.save();
  assert.throws(() => readState(f.directory));
});

test('updates both aliases and the lock together, using strict peers without scripts', t => {
  const f = fixture(t);
  mockNpm(f.directory, updates);
  const result = run(f.directory);
  assert.equal(result.status, 0, result.stderr);
  const state = readState(f.directory);
  assert.equal(state.manifest.devDependencies['@typescript/native'], 'npm:typescript@^7.1.0');
  assert.equal(state.manifest.devDependencies.typescript, 'npm:@typescript/typescript6@^6.0.3');
  assert.equal(state.manifest.devDependencies.eslint, '^9.39.5');
  const calls = readFileSync(join(f.directory, 'npm-calls.jsonl'), 'utf8').trim().split('\n').map(JSON.parse);
  assert.deepEqual(calls.at(-1), ['install', '--package-lock-only', '--ignore-scripts', '--strict-peer-deps']);
});

test('current versions do not rewrite files or install', t => {
  const f = fixture(t);
  const before = readFileSync(join(f.directory, 'package.json'), 'utf8');
  mockNpm(f.directory, { 'typescript@7': '7.0.2', '@typescript/typescript6@6': '6.0.2' });
  const result = run(f.directory);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /are current/);
  assert.equal(readFileSync(join(f.directory, 'package.json'), 'utf8'), before);
  assert.equal(readFileSync(join(f.directory, 'npm-calls.jsonl'), 'utf8').trim().split('\n').length, 2);
});

for (const mode of ['registry-failure', 'install-failure', 'wrong-resolution']) {
  test(`${mode} fails without leaving partial changes`, t => {
    const f = fixture(t);
    const before = ['package.json', 'package-lock.json'].map(file => readFileSync(join(f.directory, file), 'utf8'));
    mockNpm(f.directory, updates, mode);
    assert.notEqual(run(f.directory).status, 0);
    for (const [i, file] of ['package.json', 'package-lock.json'].entries()) {
      assert.equal(readFileSync(join(f.directory, file), 'utf8'), before[i]);
    }
  });
}

test('registry downgrades and malformed metadata fail the CLI', t => {
  for (const bad of ['7.0.1', null, [], { version: '7.1.0' }, ['7.1.0', false]]) {
    const f = fixture(t);
    mockNpm(f.directory, { ...updates, 'typescript@7': bad });
    assert.notEqual(run(f.directory).status, 0);
    assert.equal(readState(f.directory).manifest.devDependencies['@typescript/native'], 'npm:typescript@^7.0.2');
  }
});

test('publisher rejects unrelated changes, no-ops, downgrades, and wrong alias identities', t => {
  const base = fixture(t);
  const candidate = fixture(t);
  assert.throws(() => verifyCandidate(base.directory, candidate.directory), /no TypeScript alias update/);
  mockNpm(candidate.directory, updates);
  assert.equal(run(candidate.directory).status, 0);
  assert.doesNotThrow(() => verifyCandidate(base.directory, candidate.directory));
  const valid = readFileSync(join(candidate.directory, 'package.json'), 'utf8');
  for (const change of [
    m => { m.scripts.typecheck = 'true'; },
    m => { m.devDependencies.eslint = '^10.0.0'; },
    m => { m.devDependencies.typescript = 'npm:typescript@^7.1.0'; },
    m => { m.devDependencies.typescript = 'npm:@typescript/typescript6@^6.0.1'; },
  ]) {
    const m = JSON.parse(valid);
    change(m);
    writeFileSync(join(candidate.directory, 'package.json'), JSON.stringify(m));
    assert.throws(() => verifyCandidate(base.directory, candidate.directory));
  }
});

test('installed identity guard rejects wrong compiler, API, and missing installations', t => {
  for (const problem of ['missing', 'compiler', 'api', 'api-shape', 'package']) {
    const f = fixture(t);
    if (problem !== 'missing') {
      for (const { name, target } of aliases) {
        const path = join(f.directory, 'node_modules', name);
        mkdirSync(path, { recursive: true });
        writeFileSync(join(path, 'package.json'), JSON.stringify({
          name: problem === 'package' ? 'wrong' : target,
          version: name === 'typescript' ? '6.0.2' : '7.0.2',
        }));
      }
      writeFileSync(join(f.directory, 'node_modules/typescript/index.js'),
        `module.exports = { version: '${problem === 'api' ? '7.0.2' : '6.0.3'}', createProgram: ${problem === 'api-shape' ? 'null' : '() => {}'} };`);
      mkdirSync(join(f.directory, 'node_modules/.bin'));
      writeFileSync(join(f.directory, 'node_modules/.bin/tsc'),
        `#!/usr/bin/env node\nconsole.log('Version ${problem === 'compiler' ? '6.0.3' : '7.0.2'}');\n`, { mode: 0o755 });
    }
    assert.notEqual(run(f.directory, ['--check-installed']).status, 0, problem);
  }
});
