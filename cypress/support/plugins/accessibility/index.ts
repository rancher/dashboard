/* eslint-disable no-console */
import * as fs from 'fs';
import * as path from 'path';
import * as sha from 'sha.js';
import { createHtmlReport } from 'axe-html-reporter';

const calcHash = function(str) {
  return sha.default('sha256').update(str).digest('hex');
};

function createPath(testPath: string[]) {
  const currentSpec = chain[chain.length - 1];

  let found = currentSpec;

  for (const p of testPath) {
    const f = found.children.filter((item) => item.name === p);

    if (f.length === 1) {
      found = f[0];
    } else {
      const c = {
        name:       p,
        children:   [],
        violations: [],
        incomplete: [],
        leaf:       false,
      };

      found.children.push(c);
      found = c;
    }
  }

  return found;
}

export type TestViolation = {
  name: string;
  children: TestViolation[];
  violations: any[];
  incomplete: any[];
  leaf: boolean;
  screenshot?: string;
};

export type Options = {
  violations: any[];
  titlePath: string[];
};

export type IncompleteOptions = {
  incomplete: any[];
  titlePath: string[];
};

export type RuleSummaryEntry = {
  id: string;
  help: string;
  tags: string[];
  // Node counts per axe result bucket, summed over every check in the run
  violations: number;
  incomplete: number;
  passes: number;
  inapplicable: number;
  // How many of the run's checks evaluated this rule at all
  checks: number;
};

export type RuleOptions = {
  titlePath: string[];
  availableRules: string[];
  violations: any[];
  incomplete: any[];
  passes: any[];
  inapplicable: any[];
};

const BUCKETS: (keyof RuleSummaryEntry)[] = ['violations', 'incomplete', 'passes', 'inapplicable'];

type Screenshot = {
  name: string;
  specName: string;
  path: string;
};

// Root chain
const chain: TestViolation[] = [{
  name:       'Root',
  children:   [],
  violations: [],
  incomplete: [],
  leaf:       false,
}];

const allViolations = [] as any[];
const allIncomplete = [] as any[];
const screenshots = [] as Screenshot[];
const ruleSummary: {[id: string]: RuleSummaryEntry} = {};
const availableRules = new Set<string>();
let folder;

// Tidy up the chain
function tidy(item: TestViolation) {
  item.children.forEach((i) => tidy(i));

  if (item.violations.length === 0 && item.incomplete.length === 0 && item.children.length === 1) {
    if (item.children[0].leaf) {
      // Collapse up
      item.violations = item.children[0].violations;
      item.incomplete = item.children[0].incomplete;
      item.children = [];
    }
  }
}

export function a11yScreenshot(options: any) {
  const { titlePath, props } = options;
  const found = createPath(titlePath);

  found.screenshot = props.path;
}

function deDuplicate(violations: any[]) {
  const result: any[] = [];
  const seen: {[key: string]: any} = {};

  violations.forEach((item) => {
    const copy = JSON.parse(JSON.stringify(item));

    delete copy.nodes;

    const hash = calcHash(JSON.stringify(copy));

    if (!seen[hash]) {
      seen[hash] = item;
      result.push(item);
    } else {
      // Merge the nodes
      const existing = seen[hash];

      item.nodes.forEach((node) => {
        const str = JSON.stringify(node);
        const exists = existing.nodes.find((n) => JSON.stringify(n) === str);

        if (!exists) {
          existing.nodes.push(node);
        }
      });
    }
  });

  return result;
}

/**
 * Build the 'needs review' report.
 *
 * `axe-html-reporter` only renders detailed per-node cards for whatever sits in `results.violations`.
 * Its native `incomplete` section is a summary table and nothing else, which isn't enough to triage
 * from - no element location, no source, no reason axe gave up. So we hand it the incomplete results
 * in the `violations` slot to get the identical presentation, then correct the wording the template
 * hard-codes.
 */
function createIncompleteReport(incomplete: any[]) {
  const customSummary = [
    '<b>These are not confirmed failures.</b> This is axe\'s <code>incomplete</code> bucket - checks it',
    'could neither pass nor fail with certainty, so it hands them to a human. Every entry needs a manual',
    'decision: it is either a real issue or a false alarm. Nothing here failed CI.'
  ].join(' ');

  const html = createHtmlReport({
    results: { violations: incomplete },
    options: {
      projectKey:            'Rancher Manager',
      customSummary,
      doNotCreateReportFile: true,
    },
  });

  return html
    .replace('<title>Axe-core® Accessibility Results</title>', '<title>Axe-core® Accessibility Results - Needs Review</title>')
    .replace('Axe-core® Accessibility Results for', 'Axe-core® Accessibility Results - Needs Review for')
    .replace(/axe-core found (<span class="badge badge-\w+">\d+<\/span>) violations?/, 'axe-core flagged $1 check(s) that need manual review')
    .replace('<h3>Failed</h3>', '<h3>Needs review</h3>')
    .replace(/To solve this violation, you need to\.\.\./g, 'To resolve this check, you need to...');
}

/**
 * One row per axe rule, showing which bucket its results landed in over the whole run, plus the rules
 * axe offered but never produced a single result for.
 */
function summariseRules() {
  const rules = Object.values(ruleSummary).sort((a, b) => a.id.localeCompare(b.id));
  const neverRun = Array.from(availableRules).filter((id) => !ruleSummary[id]).sort();

  return { rules, neverRun };
}

function registerHooks(on, config) {
  // Get the folder to write the reports into
  folder = config.env.a11yFolder;

  // fs.rmdirSync(folder);
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder);
  }

  on('task', {
    a11y(options: Options) {
      const { violations, titlePath } = options;
      const found = createPath(titlePath);

      allViolations.push(...violations);

      found.violations.push(...violations);
      found.leaf = true;

      return null;
    },

    // axe's 'needs review' bucket - results it could neither pass nor fail definitively.
    // Recorded separately so a clean `violations` list is never mistaken for "no problems".
    a11yIncomplete(options: IncompleteOptions) {
      const { incomplete, titlePath } = options;
      const found = createPath(titlePath);

      allIncomplete.push(...incomplete);

      found.incomplete.push(...incomplete);
      found.leaf = true;

      return null;
    },

    // Rule-level tally across all four axe buckets. This is what tells us whether a rule we expect to
    // see (`color-contrast`, say) ran and passed, ran and matched nothing, or never ran at all.
    a11yRules(options: RuleOptions) {
      (options.availableRules || []).forEach((id) => availableRules.add(id));

      BUCKETS.forEach((bucket) => {
        (options[bucket] || []).forEach((rule) => {
          if (!ruleSummary[rule.id]) {
            ruleSummary[rule.id] = {
              id:           rule.id,
              help:         rule.help,
              tags:         rule.tags,
              violations:   0,
              incomplete:   0,
              passes:       0,
              inapplicable: 0,
              checks:       0,
            };
          }

          (ruleSummary[rule.id][bucket] as number) += rule.nodes;
          ruleSummary[rule.id].checks++;
        });
      });

      return null;
    },
  });

  on('task', {
    log(message) {
      console.log(message);

      return null;
    },
    table(message) {
      console.table(message);

      return null;
    }
  });

  on('before:spec', (spec) => {
    const newSpec = {
      name:       spec.baseName,
      children:   [],
      violations: [],
      incomplete: [],
      leaf:       false,
    };

    chain[0].children.push(newSpec);

    // Push the spec onto the chain
    chain.push(newSpec);
  });

  on('after:spec', () => {
    // Pop the spec off of the chain
    chain.pop();
  });

  on('after:screenshot', (details) => {
    const { name, specName, path } = details;

    screenshots.push({
      name,
      specName,
      path
    });
  });

  on('after:run', (results) => {
    const root = chain[0];

    tidy(root);

    const stats = { ...results };

    delete stats.runs;
    delete stats.config;
    delete stats.runUrl;
    delete stats.osName;
    delete stats.osVersion;

    const { rules, neverRun } = summariseRules();

    const data = {
      stats,
      ruleSummary: {
        rules,
        neverRun,
      },
      children: root.children
    };

    console.log('\nAxe rule coverage (node counts per bucket)');
    console.table(rules);

    if (neverRun.length) {
      console.log(`\n⚠️  ${ neverRun.length } rule(s) available to axe produced no result in any bucket: ${ neverRun.join(', ') }`);
    }

    fs.writeFileSync(path.join(folder, 'accessibility.json'), JSON.stringify(data, null, 2));

    const screenFolder = path.join(folder, 'screenshots');

    if (!fs.existsSync(screenFolder)) {
      fs.mkdirSync(screenFolder);
    }

    // Move the screenshots into place
    screenshots.forEach((s) => {
      const destFile = path.join(screenFolder, path.basename(s.path));

      fs.renameSync(s.path, destFile);
    });

    const reportHTML = createHtmlReport({
      results: {
        violations: deDuplicate(allViolations),
        incomplete: deDuplicate(allIncomplete),
      },
      options: {
        projectKey:            'Rancher Manager',
        doNotCreateReportFile: true,
      },
    });

    fs.writeFileSync(path.join(folder, 'accessibility.html'), reportHTML);

    fs.writeFileSync(
      path.join(folder, 'accessibility-incomplete.html'),
      createIncompleteReport(deDuplicate(allIncomplete))
    );

    return null;
  });

  return config;
}

export default registerHooks;
