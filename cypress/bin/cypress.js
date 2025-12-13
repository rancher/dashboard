#!/usr/bin/env node

// CLI wrapper for Cypress from @rancher/cypress package
const { spawn } = require('child_process');
const path = require('path');

// For linked packages, we need to use the cypress from this package's dependencies
// or fall back to the one that might be available in the calling project

let cypressBin;

try {
  // Try to find cypress relative to this package directory
  const packageRoot = path.join(__dirname, '..');

  // Check if this package has cypress installed
  try {
    const cypressPath = path.join(packageRoot, 'node_modules', 'cypress', 'bin', 'cypress');
    const fs = require('fs');

    if (fs.existsSync(cypressPath)) {
      cypressBin = cypressPath;
    } else {
      // If not found, try to use Node's resolution from current working directory
      const cypressModule = require.resolve('cypress/bin/cypress', { paths: [process.cwd(), packageRoot, __dirname] });

      cypressBin = cypressModule;
    }
  } catch (e) {
    // Last resort: try global resolution
    cypressBin = require.resolve('cypress/bin/cypress');
  }
} catch (err) {
  console.error('Could not find cypress binary. Please ensure cypress is available.');
  console.error('This can happen if @rancher/cypress dependencies are not installed.');
  console.error('Try: cd cypress/dist && npm install');
  process.exit(1);
}

// Forward all arguments to cypress
const args = process.argv.slice(2);

// Spawn cypress with the arguments
const cypress = spawn(cypressBin, args, {
  stdio: 'inherit',
  cwd:   process.cwd()
});

// Forward exit code
cypress.on('close', (code) => {
  process.exit(code);
});

// Handle errors
cypress.on('error', (err) => {
  console.error('Error running cypress:', err);
  process.exit(1);
});
