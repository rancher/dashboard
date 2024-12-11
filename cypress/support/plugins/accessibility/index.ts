/* eslint-disable no-console */
import * as fs from 'fs';
import * as path from 'path';
import { createHtmlReport } from 'axe-html-reporter';

const allViolations = [] as any[];
let folder;

function registerHooks(on, config) {
  // Get the folder to write the reports into
  folder = config.env.a11yFolder;

  // fs.rmdirSync(folder);
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder);
  }

  on('task', {
    a11y(violations: any[]) {
      allViolations.push(...violations);

      console.log(this);

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
    console.log('Before spec');
    console.log(spec);
  });

  on('after:run', () => {
    fs.writeFileSync(path.join(folder, 'accessibility.json'), JSON.stringify(allViolations, null, 2));

    const reportHTML = createHtmlReport({
      results: { violations: allViolations },
      options: {
        projectKey:            'Rancher Manager',
        doNotCreateReportFile: true,
      },
    });

    fs.writeFileSync(path.join(folder, 'accessibility.html'), reportHTML);

    // Write the validation data to disk and transform to HTML

    return null;
  });

  return config;
}

export default registerHooks;
