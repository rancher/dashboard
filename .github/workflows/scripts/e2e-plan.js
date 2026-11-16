#!/usr/bin/env node

/**
 * Plans the e2e jobs.
 *
 * Recordings are kept in the Actions cache, which only workflow runs can read, under `e2e-recordings/<group>/<run>`.
 * Each generate job also publishes how long each of its specs took to record, as the `e2e-durations-<group>` artifact,
 * which is what the integration shards are balanced by.
 *
 * `e2e-plan.js count <grep tags>` prints how many specs have tests matching the tags.
 *
 * `e2e-plan.js durations <recordings dir> <username>` prints how long each spec recorded there took, in seconds, as JSON.
 *
 * `e2e-plan.js integration` prints the GitHub outputs of the integration jobs:
 * - `recordings-runs`: the runs whose recordings are replayed, the newest that recorded each feature group on this pull
 *   request's branch or else on the base branch (set `E2E_RECORDINGS_RUN` to choose the run). Empty when there are none
 * - `matrix`: one entry per shard of each feature group with tests, its specs balanced by how long they took to record,
 *   and the cache key prefix of the group's recordings in `recordings`
 *
 * It reads `GITHUB_REPOSITORY`, `GITHUB_RUN_ID`, `GITHUB_RUN_ATTEMPT`, `GITHUB_EVENT_NAME`, `BASE_BRANCH`, `HEAD_REPO`,
 * `HEAD_BRANCH` and `E2E_GROUPS` (`{ "roles": [{ "username", "tag" }], "features": [["@tag", ...]] }`).
 */

const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { plugin: grepPlugin } = require('@cypress/grep/plugin');

const TESTS_DIR = 'cypress/e2e/tests';
const SKIPPED_DIRS = ['setup'];
const DURATIONS_PREFIX = 'e2e-durations-';
const DURATIONS_FILE = 'e2e-durations.json';
const RECORDINGS_CACHE_PREFIX = 'e2e-recordings/';
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

const recordedSeconds = (har) => {
  const { entries } = JSON.parse(fs.readFileSync(har, 'utf8')).log;
  const start = entries.reduce((min, e) => Math.min(min, Date.parse(e.startedDateTime)), Infinity);
  const end = entries.reduce((max, e) => Math.max(max, Date.parse(e.startedDateTime) + (e.time || 0)), -Infinity);

  return entries.length ? Math.round((end - start) / 1000) : UNRECORDED_SPEC_SECONDS;
};

const durations = (recordingsDir, username) => {
  const root = path.join(recordingsDir, username);
  const found = {};
  const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
    const file = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      walk(file);
    } else if (entry.name.endsWith('.har')) {
      found[path.join(TESTS_DIR, `${ path.relative(root, file).replace(/\.har$/, '') }.spec.ts`)] = recordedSeconds(file);
    }
  });

  if (fs.existsSync(root)) {
    walk(root);
  }

  return found;
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

const durationArtifacts = (repo, runId) => {
  const newest = new Map();

  gh(`repos/${ repo }/actions/runs/${ runId }/artifacts?per_page=100`, '--paginate', '--jq', '.artifacts[] | select(.expired | not) | {id, name, created_at}')
    .split('\n').filter((line) => line.trim()).map((line) => JSON.parse(line))
    .filter((a) => a.name.startsWith(DURATIONS_PREFIX))
    .forEach((a) => {
      if (!newest.has(a.name) || newest.get(a.name).created_at < a.created_at) {
        newest.set(a.name, a);
      }
    });

  return [...newest.values()];
};

const recordingCandidates = (env) => {
  const repo = env.GITHUB_REPOSITORY;

  if (env.E2E_RECORDINGS_RUN) {
    return [env.E2E_RECORDINGS_RUN];
  }

  const { workflow_id: workflowId } = ghJson(`repos/${ repo }/actions/runs/${ env.GITHUB_RUN_ID }`);
  const runs = (query) => ghJson(`repos/${ repo }/actions/workflows/${ workflowId }/runs?per_page=${ RUNS_TO_SEARCH }&${ query }`).workflow_runs;
  const candidates = [];

  if (env.GITHUB_EVENT_NAME === 'pull_request' && env.HEAD_BRANCH) {
    candidates.push(...runs(`branch=${ encodeURIComponent(env.HEAD_BRANCH) }&event=pull_request`).filter((r) => r.head_repository?.full_name === env.HEAD_REPO));
  }
  candidates.push(...runs(`branch=${ encodeURIComponent(env.BASE_BRANCH) }&event=push`));

  return candidates
    .filter((run) => run.status === 'completed' || (String(run.id) === String(env.GITHUB_RUN_ID) && Number(env.GITHUB_RUN_ATTEMPT) > 1))
    .map((run) => String(run.id));
};

const findDurations = (env, names) => {
  const found = new Map();

  for (const runId of recordingCandidates(env)) {
    if (names.every((name) => found.has(name))) {
      break;
    }
    durationArtifacts(env.GITHUB_REPOSITORY, runId)
      .filter((a) => names.includes(a.name) && !found.has(a.name))
      .forEach((a) => found.set(a.name, { ...a, runId }));
  }

  return found;
};

const downloadDurations = (repo, artifact, dir) => {
  const zip = path.join(dir, `${ artifact.id }.zip`);

  fs.writeFileSync(zip, ghApi([`repos/${ repo }/actions/artifacts/${ artifact.id }/zip`]));
  execFileSync('unzip', ['-q', '-o', zip, DURATIONS_FILE, '-d', path.join(dir, artifact.name)]);

  return JSON.parse(fs.readFileSync(path.join(dir, artifact.name, DURATIONS_FILE), 'utf8'));
};

const planIntegration = (env) => {
  const { roles, features } = JSON.parse(env.E2E_GROUPS);
  const groups = roles.flatMap(({ username, tag }) => features.map((groupFeatures) => ({
    username,
    tag,
    features: groupFeatures,
    name:     `${ username }${ groupFeatures.join('') }`,
    specs:    matchingSpecs(groupTags(tag, groupFeatures)),
  })));
  const found = findDurations(env, groups.filter((g) => g.specs.length).map((g) => `${ DURATIONS_PREFIX }${ g.name }`));
  const dir = fs.mkdtempSync(path.join(env.RUNNER_TEMP || os.tmpdir(), 'e2e-plan-'));
  const include = [];

  groups.forEach(({
    username, tag, features: groupFeatures, name, specs
  }) => {
    const artifact = found.get(`${ DURATIONS_PREFIX }${ name }`);
    const recorded = artifact ? downloadDurations(env.GITHUB_REPOSITORY, artifact, dir) : {};
    const timed = specs.map((spec) => ({ spec, seconds: recorded[spec] ?? UNRECORDED_SPEC_SECONDS }));
    const seconds = timed.reduce((sum, s) => sum + s.seconds, 0);
    const count = Math.min(MAX_SHARDS, timed.length, Math.max(1, Math.ceil(seconds / SHARD_SECONDS)));

    console.error(`${ username } ${ groupFeatures.join(' ') }: ${ timed.length } specs, ${ (seconds / 60).toFixed(1) } min recorded${ artifact ? ` in run ${ artifact.runId }` : '' }, ${ timed.length ? count : 0 } shards`);
    if (!timed.length) {
      return;
    }

    shard(timed, count).forEach((shardSpecs, i) => include.push({
      username,
      tag,
      features:   groupFeatures,
      shard:      i + 1,
      shards:     count,
      specs:      shardSpecs.join(','),
      recordings: artifact ? `${ RECORDINGS_CACHE_PREFIX }${ name }/` : '',
    }));
  });

  fs.rmSync(dir, { recursive: true, force: true });

  return { runs: [...new Set([...found.values()].map((a) => a.runId))], matrix: { include } };
};

const [command, ...args] = process.argv.slice(2);

if (command === 'count') {
  console.log(matchingSpecs(args[0]).length);
} else if (command === 'durations') {
  console.log(JSON.stringify(durations(args[0], args[1]), null, 2));
} else if (command === 'integration') {
  const { runs, matrix } = planIntegration(process.env);

  console.log(`recordings-runs=${ runs.join(' ') }`);
  console.log(`matrix=${ JSON.stringify(matrix) }`);
} else {
  console.error('Usage: e2e-plan.js count <grep tags> | e2e-plan.js durations <recordings dir> <username> | e2e-plan.js integration');
  process.exit(1);
}
