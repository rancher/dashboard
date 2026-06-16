#!/usr/bin/env node

const { spawnSync } = require('child_process');

const [, , cmd, ...args] = process.argv;

function showHelp() {
  console.log(`\n@rancher/cypress CLI\n\nUsage:\n  npx rancher-cypress <command> [args]\n\nCommands:\n  open         Launch Cypress UI\n  run          Run Cypress tests\n  init         Scaffold Cypress project structure\n\nExamples:\n  npx rancher-cypress open\n  npx rancher-cypress run\n  npx rancher-cypress init\n`);
}

if (!cmd) {
  showHelp();
  process.exit(0);
}

if (cmd === 'init') {
  require('./init');
} else {
  // Try to resolve cypress binary in the consuming project
  let cypressBin;

  try {
    cypressBin = require.resolve('./node_modules/.bin/cypress', { paths: [process.cwd()] });
  } catch (e) {
    console.error('\nERROR: Cypress is not installed in this project.\nPlease install it with:\n  npm install cypress --save-dev\n');
    process.exit(1);
  }
  const result = spawnSync(cypressBin, [cmd, ...args], { stdio: 'inherit' });

  process.exit(result.status);
}
