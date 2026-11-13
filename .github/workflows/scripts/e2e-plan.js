#!/usr/bin/env node

/**
 * Plans the e2e jobs.
 *
 * `e2e-plan.js count <grep tags>` prints how many specs have tests matching the tags.
 *
 * `e2e-plan.js integration` prints the GitHub outputs of the integration jobs:
 * - `recordings-run`: the newest completed run of this workflow that uploaded recordings, on the base branch or else
 *   on this pull request's branch (set `E2E_RECORDINGS_RUN` to choose one)
 * - `matrix`: one entry per shard of each feature group with tests, its specs balanced by how long they took to record
 *
 * It reads `GITHUB_REPOSITORY`, `GITHUB_RUN_ID`, `GITHUB_EVENT_NAME`, `BASE_BRANCH`, `HEAD_REPO`, `HEAD_BRANCH` and
 * `E2E_GROUPS` (`{ "roles": [{ "username", "tag" }], "features": [["@tag", ...]] }`).
 */

const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { plugin: grepPlugin } = require('@cypress/grep/plugin');

const TESTS_DIR = 'cypress/e2e/tests';
const SKIPPED_DIRS = ['setup'];
const RECORDINGS_PREFIX = 'e2e-recordings-';
const SHARD_SECONDS = 4 * 60;
const MAX_SHARDS = 4;
const UNRECORDED_SPEC_SECONDS = 60;
const RUNS_TO_SEARCH = 10;

const groupTags = (tag, features) => `${ tag }+${ features[0] } --@jenkins ${ tag }+${ features[1] || features[0] } --@jenkins`;

const matchingSpecs = (grepTags) => {
  const specPattern = [`${ TESTS_DIR }/**/*.spec.ts`];
  const config = {
    specPattern,
    excludeSpecPattern: SKIPPED_DIRS.map((dir) => `${ TESTS_DIR }/${ dir }/**`),
    expose:             { grepTags, grepFilterSpecs: true },
  };
  const log = console.log;

  console.log = () => {};
  try {
    grepPlugin(config);
  } finally {
    console.log = log;
  }

  return config.specPattern === specPattern ? [] : config.specPattern.map((file) => path.relative(process.cwd(), file)).sort();
};

const recordedSeconds = (recordingsDir, username, spec) => {
  const har = path.join(recordingsDir, username, `${ path.relative(TESTS_DIR, spec).replace(/\.spec\.ts$/, '') }.har`);

  try {
    const { entries } = JSON.parse(fs.readFileSync(har, 'utf8')).log;
    const start = entries.reduce((min, e) => Math.min(min, Date.parse(e.startedDateTime)), Infinity);
    const end = entries.reduce((max, e) => Math.max(max, Date.parse(e.startedDateTime) + (e.time || 0)), -Infinity);

    return entries.length ? (end - start) / 1000 : UNRECORDED_SPEC_SECONDS;
  } catch {
    return UNRECORDED_SPEC_SECONDS;
  }
};

const shard = (specs, count) => {
  const shards = Array.from({ length: count }, () => ({ seconds: 0, specs: [] }));

  [...specs].sort((a, b) => b.seconds - a.seconds || a.spec.localeCompare(b.spec)).forEach((s) => {
    const emptiest = shards.reduce((min, sh) => (sh.seconds < min.seconds ? sh : min));

    emptiest.specs.push(s.spec);
    emptiest.seconds += s.seconds;
  });

  return shards.map((s) => s.specs.sort());
};

const GH_ATTEMPTS = 3;
const ghApi = (args, options) => {
  for (let attempt = 1; ; attempt++) {
    try {
      return execFileSync('gh', ['api', ...args], { maxBuffer: 1024 * 1024 * 1024, ...options });
    } catch (e) {
      if (attempt >= GH_ATTEMPTS) {
        throw e;
      }
      console.error(`Retrying gh api ${ args[0] }: ${ e.message.split('\n')[0] }`);
    }
  }
};
const gh = (endpoint, ...args) => ghApi([endpoint, ...args], { encoding: 'utf8' });
const ghJson = (endpoint) => JSON.parse(gh(endpoint));

const recordingArtifacts = (repo, runId) => {
  const newest = new Map();

  gh(`repos/${ repo }/actions/runs/${ runId }/artifacts?per_page=100`, '--paginate', '--jq', '.artifacts[] | select(.expired | not) | {id, name, created_at}')
    .split('\n').filter((line) => line.trim()).map((line) => JSON.parse(line))
    .filter((a) => a.name.startsWith(RECORDINGS_PREFIX))
    .forEach((a) => {
      if (!newest.has(a.name) || newest.get(a.name).created_at < a.created_at) {
        newest.set(a.name, a);
      }
    });

  return [...newest.values()];
};

const findRecordingsRun = (env) => {
  const repo = env.GITHUB_REPOSITORY;

  if (env.E2E_RECORDINGS_RUN) {
    return { runId: env.E2E_RECORDINGS_RUN, artifacts: recordingArtifacts(repo, env.E2E_RECORDINGS_RUN) };
  }

  const { workflow_id: workflowId } = ghJson(`repos/${ repo }/actions/runs/${ env.GITHUB_RUN_ID }`);
  const runs = (query) => ghJson(`repos/${ repo }/actions/workflows/${ workflowId }/runs?status=completed&per_page=${ RUNS_TO_SEARCH }&${ query }`).workflow_runs;
  const candidates = runs(`branch=${ encodeURIComponent(env.BASE_BRANCH) }&event=push`);

  if (env.GITHUB_EVENT_NAME === 'pull_request' && env.HEAD_BRANCH) {
    candidates.push(...runs(`branch=${ encodeURIComponent(env.HEAD_BRANCH) }&event=pull_request`).filter((r) => r.head_repository?.full_name === env.HEAD_REPO));
  }

  for (const run of candidates) {
    const artifacts = String(run.id) === String(env.GITHUB_RUN_ID) ? [] : recordingArtifacts(repo, run.id);

    if (artifacts.length) {
      return { runId: String(run.id), artifacts };
    }
  }

  return { runId: '', artifacts: [] };
};

const downloadHars = (repo, artifacts, dir) => {
  artifacts.forEach((a) => {
    const zip = path.join(dir, `${ a.id }.zip`);

    fs.writeFileSync(zip, ghApi([`repos/${ repo }/actions/artifacts/${ a.id }/zip`]));
    execFileSync('unzip', ['-q', '-o', zip, '*.har', '-d', path.join(dir, a.name)]);
    fs.rmSync(zip);
  });
};

const planIntegration = (env) => {
  const { roles, features } = JSON.parse(env.E2E_GROUPS);
  const { runId, artifacts } = findRecordingsRun(env);
  const dir = fs.mkdtempSync(path.join(env.RUNNER_TEMP || os.tmpdir(), 'e2e-plan-'));
  const include = [];

  downloadHars(env.GITHUB_REPOSITORY, artifacts, dir);
  console.error(`Recordings: ${ runId ? `run ${ runId }, ${ artifacts.length } artifacts` : 'none found' }`);

  roles.forEach(({ username, tag }) => features.forEach((groupFeatures) => {
    const name = `${ RECORDINGS_PREFIX }${ username }${ groupFeatures.join('') }`;
    const artifact = artifacts.find((a) => a.name === name);
    const specs = matchingSpecs(groupTags(tag, groupFeatures)).map((spec) => ({ spec, seconds: recordedSeconds(path.join(dir, name), username, spec) }));
    const seconds = specs.reduce((sum, s) => sum + s.seconds, 0);
    const count = Math.min(MAX_SHARDS, specs.length, Math.max(1, Math.ceil(seconds / SHARD_SECONDS)));

    console.error(`${ username } ${ groupFeatures.join(' ') }: ${ specs.length } specs, ${ (seconds / 60).toFixed(1) } min recorded, ${ specs.length ? count : 0 } shards`);
    if (!specs.length) {
      return;
    }

    shard(specs, count).forEach((shardSpecs, i) => include.push({
      username,
      tag,
      features:   groupFeatures,
      shard:      i + 1,
      shards:     count,
      specs:      shardSpecs.join(','),
      recordings: artifact ? String(artifact.id) : '',
    }));
  }));

  fs.rmSync(dir, { recursive: true, force: true });

  return { runId, matrix: { include } };
};

const [command, ...args] = process.argv.slice(2);

if (command === 'count') {
  console.log(matchingSpecs(args[0]).length);
} else if (command === 'integration') {
  const { runId, matrix } = planIntegration(process.env);

  console.log(`recordings-run=${ runId }`);
  console.log(`matrix=${ JSON.stringify(matrix) }`);
} else {
  console.error('Usage: e2e-plan.js count <grep tags> | e2e-plan.js integration');
  process.exit(1);
}
