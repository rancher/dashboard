#!/usr/bin/env node


const { execFileSync } = require('child_process');

const MODES = [
  {
    job: 'e2e-test', name: 'full', description: 'against Rancher', color: '#8b95a7', colorName: 'gray'
  },
  {
    job: 'e2e-test-integration', name: 'integration', description: 'replayed, no Rancher', color: '#2f6fde', colorName: 'blue'
  },
  {
    job: 'e2e-test-generate', name: 'generate', description: 'against Rancher, recording', color: '#e8a33d', colorName: 'amber'
  },
];
const TEST_STEP = 'Run user tests';
const CHARTED = ['full', 'integration'];
const NO_BAR = -1;

const [repo, runId, attempt = '1'] = process.argv.slice(2);

if (!repo || !runId) {
  console.error('Usage: e2e-timings.js <owner/repo> <run id> <run attempt>');
  process.exit(1);
}

const minutes = (start, end) => (start && end ? (new Date(end) - new Date(start)) / 60000 : undefined);
const fmt = (n) => (n === undefined ? '-' : n.toFixed(1));
const sum = (list) => list.reduce((total, n) => total + (n || 0), 0);
const max = (list) => list.reduce((m, n) => Math.max(m, n || 0), 0);

const output = execFileSync('gh', [
  'api', '--paginate', `repos/${ repo }/actions/runs/${ runId }/attempts/${ attempt }/jobs?per_page=100`,
  '--jq', '.jobs[] | {name, conclusion, started_at, completed_at, steps: [.steps[] | {name, started_at, completed_at}]}'
], { encoding: 'utf8' });

const jobs = output.split('\n').filter((line) => line.trim()).map((line) => JSON.parse(line));
const runStarted = execFileSync('gh', ['api', `repos/${ repo }/actions/runs/${ runId }/attempts/${ attempt }`, '--jq', '.run_started_at'], { encoding: 'utf8' }).trim();

const timings = {};
const finished = {};
const groups = [];

jobs.forEach((job) => {
  const match = job.name.match(/^([\w-]+) \(([^,]+), [^,]+, (.+?)(?:, \d+\/\d+)?\)$/);
  const mode = match && MODES.find((m) => m.job === match[1]);

  if (!mode || !job.completed_at) {
    return;
  }

  const group = `${ match[2] }: ${ match[3].replace(/@/g, '') }`;
  const step = job.steps.find((s) => s.name === TEST_STEP);

  if (!groups.includes(group)) {
    groups.push(group);
  }

  const jobMinutes = minutes(job.started_at, job.completed_at);
  const testMinutes = minutes(step?.started_at, step?.completed_at);
  const shards = timings[mode.name]?.[group];

  timings[mode.name] = timings[mode.name] || {};
  timings[mode.name][group] = {
    wall:       Math.max(shards?.wall || 0, jobMinutes),
    ci:         (shards?.ci || 0) + jobMinutes,
    tests:      shards?.tests === undefined && testMinutes === undefined ? undefined : (shards?.tests || 0) + (testMinutes || 0),
    shards:     (shards?.shards || 0) + 1,
    conclusion: shards && shards.conclusion !== 'success' ? shards.conclusion : job.conclusion,
  };
  finished[mode.name] = [finished[mode.name], job.completed_at].filter(Boolean).sort().pop();
});

groups.sort();

const series = (mode, field) => groups.map((g) => timings[mode.name][g]?.[field]);
const modes = MODES.filter((m) => timings[m.name]).sort((a, b) => sum(series(b, 'ci')) - sum(series(a, 'ci')));

if (!modes.length) {
  console.log('No e2e jobs have finished in this run.');
  process.exit(0);
}

const charted = MODES.filter((m) => CHARTED.includes(m.name) && timings[m.name]);

const chart = (title, field) => {
  const rows = groups.flatMap((g) => charted.map((m) => ({
    label: `${ g } (${ m.name })`,
    mode:  m,
    value: timings[m.name][g]?.[field],
  })));
  const top = Math.ceil(max(rows.map((r) => r.value)) / 5) * 5 || 5;

  return [
    '```mermaid',
    '---',
    'config:',
    '  xyChart:',
    '    width: 900',
    `    height: ${ 80 + rows.length * 24 }`,
    '  themeVariables:',
    '    xyChart:',
    `      plotColorPalette: "${ charted.map((m) => m.color).join(', ') }"`,
    '---',
    'xychart-beta horizontal',
    `  title "${ title }"`,
    `  x-axis [${ rows.map((r) => `"${ r.label }"`).join(', ') }]`,
    `  y-axis "Minutes" 0 --> ${ top }`,
    ...charted.map((m) => `  bar [${ rows.map((r) => r.mode === m && r.value !== undefined ? fmt(r.value) : NO_BAR).join(', ') }]`),
    '```',
  ].join('\n');
};

const totals = modes.map((m) => ({
  mode:     m,
  done:     minutes(runStarted, finished[m.name]),
  jobSum:   sum(series(m, 'ci')),
  jobMax:   max(series(m, 'wall')),
  testsSum: sum(series(m, 'tests')),
  passed:   groups.filter((g) => timings[m.name][g]?.conclusion === 'success').length,
  ran:      groups.filter((g) => timings[m.name][g]).length,
}));

const lines = [];
const legend = charted.map((m) => `${ m.name } is ${ m.colorName }`).join(', ');

lines.push('## E2E timings by mode');
lines.push('');
lines.push(`Run [${ runId }](https://github.com/${ repo }/actions/runs/${ runId }) (attempt ${ attempt }). One bar per feature group: ${ legend }. A group run in shards shows its slowest shard.`);
lines.push('');
lines.push('| Mode | Groups passed | Finished after (from run start) | Slowest job | All jobs (CI minutes) | Running the tests only |');
lines.push('| --- | --- | --- | --- | --- | --- |');
totals.forEach((t) => {
  lines.push(`| **${ t.mode.name }** (${ t.mode.description }) | ${ t.passed } / ${ t.ran } | ${ fmt(t.done) } min | ${ fmt(t.jobMax) } min | ${ fmt(t.jobSum) } min | ${ fmt(t.testsSum) } min |`);
});
lines.push('');
lines.push(chart('Whole job, minutes', 'wall'));
lines.push('');
lines.push('<details><summary>Every job</summary>');
lines.push('');
lines.push(chart(`${ TEST_STEP } step only, minutes (all shards)`, 'tests'));
lines.push('');
lines.push(`| Job | ${ modes.map((m) => `${ m.name } job | ${ m.name } tests`).join(' | ') } |`);
lines.push(`| --- | ${ modes.map(() => '--- | ---').join(' | ') } |`);
groups.forEach((g) => {
  const cells = modes.map((m) => {
    const t = timings[m.name][g];
    const icon = !t ? '' : (t.conclusion === 'success' ? ' ✅' : ' ❌');

    const shards = t?.shards > 1 ? ` (${ t.shards } shards)` : '';

    return `${ fmt(t?.wall) }${ icon }${ shards } | ${ fmt(t?.tests) }`;
  });

  lines.push(`| ${ g } | ${ cells.join(' | ') } |`);
});
lines.push('');
lines.push('</details>');

console.log(lines.join('\n'));
