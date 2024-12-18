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
  leaf: boolean;
  screenshot?: string;
};

export type Options = {
  violations: any[];
  titlePath: string[];
};

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
  leaf:       false,
}];

const allViolations = [] as any[];
const screenshots = [] as Screenshot[];
let folder;

// Tidy up the chain
function tidy(item: TestViolation) {
  item.children.forEach((i) => tidy(i));

  if (item.violations.length === 0 && item.children.length === 1) {
    if (item.children[0].leaf) {
      // Collapse up
      item.violations = item.children[0].violations;
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

    a11yScreenshot(options: any ) {
      const { titlePath, name } = options;
      const found = createPath(titlePath);

      // Move the screenshot to the accessibility folder
      const details = screenshots.find((s) => s.name === name);

      if (details) {
        const screenFolder = path.join(folder, details.specName);
        const destFile = path.join(screenFolder, `${ name }.png`);

        found.screenshot = path.join(details.specName, `${ name }.png`);

        if (!fs.existsSync(screenFolder)) {
          fs.mkdirSync(screenFolder);
        }
        fs.renameSync(details.path, destFile);
      }

      return null;
    }
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

  on('after:run', () => {
    const root = chain[0];

    tidy(root);

    fs.writeFileSync(path.join(folder, 'accessibility.json'), JSON.stringify(root.children, null, 2));

    const reportHTML = createHtmlReport({
      results: { violations: deDuplicate(allViolations) },
      options: {
        projectKey:            'Rancher Manager',
        doNotCreateReportFile: true,
      },
    });

    fs.writeFileSync(path.join(folder, 'accessibility.html'), reportHTML);

    return null;
  });

  return config;
}

export default registerHooks;
