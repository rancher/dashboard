#!/usr/bin/env node

/**
 * Plans the e2e jobs.
 *
 * `e2e-plan.js count <grep tags>` prints how many specs have tests matching the tags.
 *
 * `e2e-plan.js integration` prints the GitHub outputs of the integration jobs:
 * - `mocks`: the committed mock bundles the jobs replay, empty when there are none
 * - `matrix`: one entry per shard of each feature group with tests, its specs balanced by how long they took to record,
 *   and the group's bundle in `recordings`
 *
 * It reads `E2E_GROUPS` (`{ "roles": [{ "username", "tag" }], "features": [["@tag", ...]] }`).
 */

const fs = require('fs');
const path = require('path');
const { plugin: grepPlugin } = require('@cypress/grep/plugin');
const { durations } = require('../../../cypress/support/e2e-modes/mocks');

const TESTS_DIR = 'cypress/e2e/tests';
const MOCKS_DIR = 'cypress/integration-mocks';
const SKIPPED_DIRS = ['setup'];
const SHARD_SECONDS = 4 * 60;
const MAX_SHARDS = 4;
const UNRECORDED_SPEC_SECONDS = 60;

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

const shard = (specs, count) => {
  const shards = Array.from({ length: count }, () => ({ seconds: 0, specs: [] }));

  [...specs].sort((a, b) => b.seconds - a.seconds || a.spec.localeCompare(b.spec)).forEach((s) => {
    const emptiest = shards.reduce((min, sh) => (sh.seconds < min.seconds ? sh : min));

    emptiest.specs.push(s.spec);
    emptiest.seconds += s.seconds;
  });

  return shards.map((s) => s.specs.sort());
};

const planIntegration = (env) => {
  const { roles, features } = JSON.parse(env.E2E_GROUPS);
  const bundles = [];
  const include = [];

  roles.forEach(({ username, tag }) => features.forEach((groupFeatures) => {
    const specs = matchingSpecs(groupTags(tag, groupFeatures));
    const bundle = `${ MOCKS_DIR }/${ username }${ groupFeatures.join('') }.json.br`;
    const recorded = specs.length && fs.existsSync(bundle) ? durations(bundle) : {};
    const timed = specs.map((spec) => ({ spec, seconds: recorded[spec] ?? UNRECORDED_SPEC_SECONDS }));
    const seconds = timed.reduce((sum, s) => sum + s.seconds, 0);
    const count = Math.min(MAX_SHARDS, timed.length, Math.max(1, Math.ceil(seconds / SHARD_SECONDS)));
    const hasBundle = specs.length && fs.existsSync(bundle);

    console.error(`${ username } ${ groupFeatures.join(' ') }: ${ timed.length } specs, ${ (seconds / 60).toFixed(1) } min recorded${ hasBundle ? '' : ', no mocks' }, ${ timed.length ? count : 0 } shards`);
    if (!timed.length) {
      return;
    }
    if (hasBundle) {
      bundles.push(bundle);
    }

    shard(timed, count).forEach((shardSpecs, i) => include.push({
      username,
      tag,
      features:   groupFeatures,
      shard:      i + 1,
      shards:     count,
      specs:      shardSpecs.join(','),
      recordings: hasBundle ? bundle : '',
    }));
  }));

  return { bundles, matrix: { include } };
};

const [command, ...args] = process.argv.slice(2);

if (command === 'count') {
  console.log(matchingSpecs(args[0]).length);
} else if (command === 'integration') {
  const { bundles, matrix } = planIntegration(process.env);

  console.log(`mocks=${ bundles.join(' ') }`);
  console.log(`matrix=${ JSON.stringify(matrix) }`);
} else {
  console.error('Usage: e2e-plan.js count <grep tags> | e2e-plan.js integration');
  process.exit(1);
}
