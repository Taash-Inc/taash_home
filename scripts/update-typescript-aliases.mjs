import { execFileSync } from 'node:child_process';
import { isDeepStrictEqual } from 'node:util';
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

// Major upgrades require a deliberate migration of the compatibility setup.
export const aliases = [
  { name: '@typescript/native', target: 'typescript', major: 7 },
  { name: 'typescript', target: '@typescript/typescript6', major: 6 },
];

function stableVersion(value) {
  if (typeof value !== 'string' || !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(value)) {
    throw new Error(`Expected a stable numeric version, received ${JSON.stringify(value)}`);
  }
  const parts = value.split('.').map(Number);
  if (!parts.every(Number.isSafeInteger)) throw new Error('Version exceeds safe integer bounds');
  return parts;
}

function compare(left, right) {
  const a = stableVersion(left);
  const b = stableVersion(right);
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return a[i] > b[i] ? 1 : -1;
  }
  return 0;
}

export function latestStable(value, major) {
  const versions = typeof value === 'string' ? [value] : value;
  if (!Array.isArray(versions) || versions.length === 0) throw new Error('Registry returned no versions');
  // npm's major selector normally excludes prereleases. Never select one even if returned.
  const stable = versions.filter(version => {
    if (typeof version !== 'string') throw new Error('Registry returned a non-string version');
    if (/^\d+\.\d+\.\d+-[0-9A-Za-z.-]+$/.test(version)) return false;
    return stableVersion(version)[0] === major;
  });
  if (stable.length === 0) throw new Error(`Registry returned no stable TypeScript ${major} versions`);
  return stable.sort(compare).at(-1);
}

export function readState(directory) {
  const manifest = JSON.parse(readFileSync(resolve(directory, 'package.json'), 'utf8'));
  const lock = JSON.parse(readFileSync(resolve(directory, 'package-lock.json'), 'utf8'));
  if (lock?.lockfileVersion !== 3 || !lock.packages?.['']) throw new Error('Expected an npm v3 lockfile');
  for (const { name, target, major } of aliases) {
    const spec = manifest?.devDependencies?.[name];
    const prefix = `npm:${target}@^`;
    if (typeof spec !== 'string' || !spec.startsWith(prefix)) throw new Error(`Unexpected alias for ${name}`);
    const floor = spec.slice(prefix.length);
    const entry = lock.packages[`node_modules/${name}`];
    if (stableVersion(floor)[0] !== major || entry?.name !== target ||
        stableVersion(entry.version)[0] !== major || compare(entry.version, floor) < 0 ||
        lock.packages[''].devDependencies?.[name] !== spec) {
      throw new Error(`Manifest/lockfile compatibility mismatch for ${name}`);
    }
  }
  return { manifest, lock };
}

export function verifyCandidate(baseDirectory, candidateDirectory) {
  const base = readState(baseDirectory);
  const candidate = readState(candidateDirectory);
  const normalized = structuredClone(candidate.manifest);
  const normalizedRoot = structuredClone(candidate.lock.packages['']);
  let changed = false;
  for (const { name } of aliases) {
    const previous = base.manifest.devDependencies[name];
    const next = candidate.manifest.devDependencies[name];
    const previousFloor = previous.slice(previous.lastIndexOf('^') + 1);
    const nextFloor = next.slice(next.lastIndexOf('^') + 1);
    const previousVersion = base.lock.packages[`node_modules/${name}`].version;
    const nextVersion = candidate.lock.packages[`node_modules/${name}`].version;
    if (compare(nextFloor, previousFloor) < 0 || compare(nextVersion, previousVersion) < 0) {
      throw new Error(`Refusing to downgrade ${name}`);
    }
    changed ||= next !== previous || nextVersion !== previousVersion;
    normalized.devDependencies[name] = previous;
    normalizedRoot.devDependencies[name] = base.lock.packages[''].devDependencies[name];
  }
  if (!isDeepStrictEqual(normalized, base.manifest) ||
      !isDeepStrictEqual(normalizedRoot, base.lock.packages[''])) {
    throw new Error('Candidate changes unrelated manifest settings');
  }
  if (!changed) throw new Error('Candidate contains no TypeScript alias update');
}

export function checkInstalled(directory) {
  const { lock } = readState(directory);
  for (const { name, target } of aliases) {
    const installed = JSON.parse(readFileSync(resolve(directory, 'node_modules', name, 'package.json'), 'utf8'));
    if (installed.name !== target || installed.version !== lock.packages[`node_modules/${name}`].version) {
      throw new Error(`Installed ${name} does not match the compatibility lockfile`);
    }
  }
  const compilerVersion = execFileSync(resolve(directory, 'node_modules/.bin/tsc'), ['--version'], {
    cwd: directory, encoding: 'utf8', timeout: 30_000,
  }).trim();
  const expected = lock.packages['node_modules/@typescript/native'].version;
  if (compilerVersion !== `Version ${expected}`) throw new Error('tsc is not the selected TypeScript 7 compiler');
  const api = createRequire(resolve(directory, 'package.json'))('typescript');
  if (stableVersion(api.version)[0] !== 6 || typeof api.createProgram !== 'function') {
    throw new Error('typescript does not expose the TypeScript 6 compiler API');
  }
}

export function updateAliases(directory) {
  const { manifest, lock } = readState(directory);
  // Resolve both targets before writing anything; registry failures must fail the run.
  const updates = aliases.map(({ name, target, major }) => {
    const versions = JSON.parse(execFileSync('npm', ['view', `${target}@${major}`, 'version', '--json'], {
      cwd: directory, encoding: 'utf8', timeout: 120_000,
    }));
    const version = latestStable(versions, major);
    const locked = lock.packages[`node_modules/${name}`].version;
    if (compare(version, locked) < 0) throw new Error(`Registry would downgrade ${name}`);
    return { name, spec: `npm:${target}@^${version}` };
  });
  const changed = updates.some(({ name, spec }) => spec !== manifest.devDependencies[name]);
  if (!changed) return false;

  const manifestPath = resolve(directory, 'package.json');
  const lockPath = resolve(directory, 'package-lock.json');
  const originalManifest = readFileSync(manifestPath);
  const originalLock = readFileSync(lockPath);
  try {
    for (const { name, spec } of updates) manifest.devDependencies[name] = spec;
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    execFileSync('npm', ['install', '--package-lock-only', '--ignore-scripts', '--strict-peer-deps'], {
      cwd: directory, stdio: 'inherit', timeout: 300_000,
    });
    const result = readState(directory);
    for (const { name, spec } of updates) {
      const expected = spec.slice(spec.lastIndexOf('^') + 1);
      if (result.lock.packages[`node_modules/${name}`].version !== expected) {
        throw new Error(`Lockfile did not resolve the selected version of ${name}`);
      }
    }
  } catch (error) {
    writeFileSync(manifestPath, originalManifest);
    writeFileSync(lockPath, originalLock);
    throw error;
  }
  return true;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv.length === 4 && process.argv[2] === '--verify') {
      verifyCandidate(process.cwd(), process.argv[3]);
      console.log('Candidate preserves the TypeScript 7 / API 6 compatibility setup.');
    } else if (process.argv.length === 3 && process.argv[2] === '--check-installed') {
      checkInstalled(process.cwd());
      console.log('Verified the installed TypeScript 7 compiler and TypeScript 6 API.');
    } else if (process.argv.length === 2) {
      const changed = updateAliases(process.cwd());
      if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `changed=${changed}\n`);
      console.log(changed ? 'Updated TypeScript aliases and lockfile.' : 'TypeScript aliases are current.');
    } else {
      throw new Error('Usage: node scripts/update-typescript-aliases.mjs [--verify candidate-directory | --check-installed]');
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
