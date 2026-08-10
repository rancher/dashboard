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

export type ResultOptions = {
  titlePath: string[];
  availableRules: string[];
  violations: any[];
  incomplete: any[];
  passes: any[];
  inapplicable: any[];
};

const BUCKETS: (keyof RuleSummaryEntry)[] = ['violations', 'incomplete', 'passes', 'inapplicable'];

/**
 * Rendering every `passes` node produces an HTML file no browser will open - a full suite run passes
 * tens of thousands of nodes. Trim per rule so every rule still gets a card, and never silently: what
 * was dropped goes in the report banner and the terminal.
 */
const MAX_REPORT_NODES = Number(process.env.TEST_A11Y_MAX_REPORT_NODES) || 5000;

/**
 * Everything below crosses the Cypress task boundary, so treat it as untrusted. A bucket that arrives
 * undefined, null or as something other than an array must not take the rest of the reporting down
 * with it - `after:run` is the only chance we get to write anything at all.
 */
function toArray(value: any): any[] {
  return Array.isArray(value) ? value : [];
}

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
const allPasses = [] as any[];
const allInapplicable = [] as any[];
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

  toArray(violations).forEach((item) => {
    if (!item || !item.id) {
      return;
    }

    const copy = JSON.parse(JSON.stringify(item));

    delete copy.nodes;

    const hash = calcHash(JSON.stringify(copy));

    if (!seen[hash]) {
      // `nodes` and `tags` are the two fields axe-html-reporter dereferences without checking. A rule
      // missing either renders the whole report as a one-line error string, so normalise them here
      // rather than discovering it in an artifact nobody can open.
      seen[hash] = {
        ...item, nodes: [...toArray(item.nodes)], tags: toArray(item.tags)
      };
      result.push(seen[hash]);
    } else {
      // Merge the nodes
      const existing = seen[hash];

      toArray(item.nodes).forEach((node) => {
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

type BucketReport = {
  // File written into the a11y folder
  file: string;
  // Appended to the report title, in place of nothing
  label: string;
  // Replaces the template's hard-coded 'Failed' section heading
  heading: string;
  // Replaces 'To solve this violation, you need to...' in the per-node table
  nodeColumn: string;
  // Explains the bucket at the top of the report
  blurb: string;
  // Builds the headline, given the node total across the bucket
  summary: (nodes: number, rules: number) => string;
  // Inapplicable results carry no nodes at all, so their per-node tables render empty and are dropped
  dropNodeTables?: boolean;
};

const REPORTS: {[bucket: string]: BucketReport} = {
  incomplete: {
    file:       'accessibility-incomplete.html',
    label:      'Needs Review',
    heading:    'Needs review',
    nodeColumn: 'To resolve this check, you need to...',
    blurb:      '<b>These are not confirmed failures.</b> This is axe\'s <code>incomplete</code> bucket - checks it ' +
      'could neither pass nor fail with certainty, so it hands them to a human. Every entry needs a manual ' +
      'decision: it is either a real issue or a false alarm. Nothing here failed CI.',
    summary: (nodes) => `axe-core flagged ${ badge(nodes, 'warning') } check(s) that need manual review`,
  },
  passes: {
    file:       'accessibility-passes.html',
    label:      'Passed',
    heading:    'Passed',
    nodeColumn: 'Checks this element satisfied',
    blurb:      '<b>These all passed.</b> This is axe\'s <code>passes</code> bucket - every element that was ' +
      'tested and met the rule. It is here so rule coverage can be audited: a rule with a suspiciously low ' +
      'node count is matching fewer elements than the page actually contains, which is a very different ' +
      'problem from a rule that fails.',
    summary: (nodes) => `axe-core recorded ${ badge(nodes, 'success') } passing node(s)`,
  },
  inapplicable: {
    file:           'accessibility-inapplicable.html',
    label:          'Inapplicable',
    heading:        'Inapplicable',
    nodeColumn:     'Notes',
    dropNodeTables: true,
    blurb:          '<b>Nothing on any scanned page matched these rules.</b> This is axe\'s <code>inapplicable</code> ' +
      'bucket. Inapplicable results carry no nodes by definition, so each entry lists the rule only. A rule here ' +
      'that you expected to apply is worth a look - it means axe found no elements of that kind at all.',
    summary: (_nodes, rules) => `axe-core found no matching elements for ${ badge(rules, 'secondary') } rule(s)`,
  },
};

function badge(count: number, variant: string) {
  return `<span class="badge badge-${ variant }">${ count }</span>`;
}

/**
 * Trim a bucket so the report stays openable.
 *
 * Spread the budget evenly across rules rather than first-come-first-served, so every rule still gets
 * a card instead of the tail rendering empty.
 */
function capNodes(results: any[]) {
  const total = results.reduce((sum, rule) => sum + toArray(rule.nodes).length, 0);

  if (total <= MAX_REPORT_NODES || results.length === 0) {
    return {
      capped: results, total, shown: total
    };
  }

  // Hand out an equal share, smallest rule first, giving whatever a small rule doesn't need back to
  // the rules that do. A flat `budget / ruleCount` would waste most of the budget - a bucket like
  // `passes` is a handful of huge rules and a long tail of rules with two or three nodes each.
  const order = results.map((rule, index) => ({ index, count: toArray(rule.nodes).length }))
    .sort((a, b) => a.count - b.count);
  const allowances: number[] = [];
  let budget = MAX_REPORT_NODES;

  order.forEach(({ index, count }, position) => {
    const share = Math.max(1, Math.floor(budget / (order.length - position)));

    allowances[index] = Math.min(count, share);
    budget -= allowances[index];
  });

  const capped = results.map((rule, index) => ({ ...rule, nodes: toArray(rule.nodes).slice(0, allowances[index]) }));
  const shown = capped.reduce((sum, rule) => sum + rule.nodes.length, 0);

  return {
    capped, total, shown
  };
}

/**
 * Build a report for one axe bucket.
 *
 * `axe-html-reporter` only renders detailed per-node cards for whatever sits in `results.violations`.
 * Its native `passes` / `incomplete` / `inapplicable` sections are summary tables and nothing else -
 * no element location, no source, nothing to triage from. So we hand each bucket in through the
 * `violations` slot to get the identical presentation, then correct the wording the template
 * hard-codes.
 */
function createBucketReport(bucket: string, results: any[]) {
  const report = REPORTS[bucket];
  const deduped = deDuplicate(results);
  const { capped, total, shown } = capNodes(deduped);

  const trimmed = total > shown ? `<div class="alert alert-info" role="alert">Showing <b>${ shown }</b> of <b>${ total }</b> nodes, spread evenly ` +
      `across rules. The rest are trimmed to keep this file openable in a browser - raise ` +
      `<code>TEST_A11Y_MAX_REPORT_NODES</code> and re-run to see more. Per-rule totals are complete and unaffected; ` +
      `they are in the <code>ruleSummary</code> section of <code>accessibility.json</code>.</div>` : '';

  if (total > shown) {
    console.log(`  ${ report.file }: trimmed to ${ shown } of ${ total } nodes (TEST_A11Y_MAX_REPORT_NODES=${ MAX_REPORT_NODES })`);
  }

  let html = createHtmlReport({
    results: { violations: capped },
    options: {
      projectKey:            'Rancher Manager',
      customSummary:         `${ report.blurb }${ trimmed }`,
      doNotCreateReportFile: true,
    },
  });

  html = html
    .replace('<title>Axe-core® Accessibility Results</title>', `<title>Axe-core® Accessibility Results - ${ report.label }</title>`)
    .replace('Axe-core® Accessibility Results for', `Axe-core® Accessibility Results - ${ report.label } for`)
    .replace(/axe-core found <span class="badge badge-\w+">\d+<\/span> violations?/, report.summary(total, capped.length))
    .replace('<h3>Failed</h3>', `<h3>${ report.heading }</h3>`)
    .replace(/To solve this violation, you need to\.\.\./g, report.nodeColumn);

  if (report.dropNodeTables) {
    // Every one of these tables is empty - inapplicable results have no nodes - so they are noise
    html = html.replace(/\s*<div class="violationNode">[\s\S]*?<\/table>\s*<\/div>/g, '');
  }

  return html;
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

    // Every bucket from one axe run. Feeds the rule-level tally - which is what tells us whether a
    // rule we expect to see (`color-contrast`, say) ran and passed, ran and matched nothing, or never
    // ran at all - and collects `passes` / `inapplicable` for their own reports.
    a11yResults(options: ResultOptions) {
      toArray(options?.availableRules).forEach((id) => availableRules.add(id));

      BUCKETS.forEach((bucket) => {
        toArray(options?.[bucket]).forEach((rule) => {
          if (!rule || !rule.id) {
            return;
          }

          if (!ruleSummary[rule.id]) {
            ruleSummary[rule.id] = {
              id:           rule.id,
              help:         rule.help,
              tags:         toArray(rule.tags),
              violations:   0,
              incomplete:   0,
              passes:       0,
              inapplicable: 0,
              checks:       0,
            };
          }

          (ruleSummary[rule.id][bucket] as number) += toArray(rule.nodes).length;
          ruleSummary[rule.id].checks++;
        });
      });

      allPasses.push(...toArray(options?.passes));
      allInapplicable.push(...toArray(options?.inapplicable));

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

    // One report per remaining bucket. Each is written independently: a bucket that arrives empty,
    // missing or malformed must not cost us the other reports, and none of it is worth failing the
    // run over - by this point the tests have already passed and the JSON is on disk.
    const buckets: {[bucket: string]: any[]} = {
      incomplete:   allIncomplete,
      passes:       allPasses,
      inapplicable: allInapplicable,
    };

    Object.keys(REPORTS).forEach((bucket) => {
      const { file } = REPORTS[bucket];

      try {
        const contents = toArray(buckets[bucket]);

        if (!contents.length) {
          console.log(`  ${ file }: no '${ bucket }' results recorded, writing an empty report`);
        }

        fs.writeFileSync(path.join(folder, file), createBucketReport(bucket, contents));
      } catch (e) {
        console.error(`Failed to write ${ file }: ${ e }`);
      }
    });

    return null;
  });

  return config;
}

export default registerHooks;
