#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');

function copyTemplateFiles(templateDir, targetDir) {
  if (!fs.existsSync(templateDir)) {
    console.error(`\nTemplate directory not found: ${ templateDir }`);
    process.exit(1);
  }
  fs.copySync(templateDir, targetDir, {
    overwrite:    false,
    errorOnExist: true,
    filter:       (src) => {
      // Skip node_modules, .DS_Store, and any README.md files
      const rel = path.relative(templateDir, src);

      return !rel.includes('node_modules') && !rel.endsWith('.DS_Store') && !rel.endsWith('README.md');
    }
  });
}

function main() {
  const cwd = process.cwd();
  const templateDir = path.join(__dirname, '../template');
  const targetCypressDir = path.join(cwd, 'cypress');
  const rootConfigFile = path.join(cwd, 'cypress.config.ts');

  if (fs.existsSync(targetCypressDir)) {
    console.error('\n🚫 A cypress/ directory already exists in this project. Aborting.\n');
    process.exit(1);
  }
  if (fs.existsSync(rootConfigFile)) {
    console.error('\n🚫 A cypress.config.ts already exists in this project root. Aborting.\n');
    process.exit(1);
  }

  console.log(`\nScaffolding Cypress project structure in: ${ targetCypressDir }`);
  try {
    fs.ensureDirSync(targetCypressDir);

    // Copy all template files except cypress.config.ts into cypress/
    copyTemplateFiles(templateDir, targetCypressDir);

    // Copy cypress.config.ts to root if it exists in template
    const templateConfigFile = path.join(templateDir, 'cypress.config.ts');

    if (fs.existsSync(templateConfigFile)) {
      fs.copyFileSync(templateConfigFile, rootConfigFile);
    }

    // Remove cypress.config.ts from cypress/
    const copiedConfig = path.join(targetCypressDir, 'cypress.config.ts');

    if (fs.existsSync(copiedConfig)) {
      fs.removeSync(copiedConfig);
    }

    // Add Cypress scripts to package.json
    const pkgJsonPath = path.join(cwd, 'package.json');

    if (fs.existsSync(pkgJsonPath)) {
      try {
        const pkg = fs.readJsonSync(pkgJsonPath);

        pkg.scripts = pkg.scripts || {};
        let changed = false;

        if (!pkg.scripts['cypress:open']) {
          pkg.scripts['cypress:open'] = 'rancher-cypress open --e2e --browser chrome';
          changed = true;
        }
        if (!pkg.scripts['cypress:run']) {
          pkg.scripts['cypress:run'] = 'rancher-cypress run';
          changed = true;
        }
        if (changed) {
          fs.writeJsonSync(pkgJsonPath, pkg, { spaces: 2 });
          console.log('\n  Added cypress:open and/or cypress:run scripts to package.json');
        } else {
          console.log('\n  cypress:open and cypress:run scripts already exist in package.json');
        }
      } catch (e) {
        console.error('\n❌ Could not update package.json with Cypress scripts:', e);
      }
    } else {
      console.warn('\n⚠️  No package.json found in project root. Skipping script addition.');
    }

    // Add or create tsconfig.json with "cypress" in types
    const tsConfigPath = path.join(cwd, 'tsconfig.json');
    if (fs.existsSync(tsConfigPath)) {
      try {
        const tsConfig = fs.readJsonSync(tsConfigPath);
        tsConfig.compilerOptions = tsConfig.compilerOptions || {};
        let types = tsConfig.compilerOptions.types || [];
        if (!Array.isArray(types)) types = [types];
        if (!types.includes('cypress')) {
          types.push('cypress');
          tsConfig.compilerOptions.types = types;
          fs.writeJsonSync(tsConfigPath, tsConfig, { spaces: 2 });
          console.log('\n  Added "cypress" to compilerOptions.types in tsconfig.json');
        } else {
          console.log('\n  "cypress" already present in compilerOptions.types in tsconfig.json');
        }
      } catch (e) {
        console.error('\n❌ Could not update tsconfig.json:', e);
      }
    } else {
      // Create a basic tsconfig.json
      const basicTsConfig = {
        compilerOptions: {
          target: "esnext",
          module: "commonjs",
          types: ["cypress"]
        }
      };
      try {
        fs.writeJsonSync(tsConfigPath, basicTsConfig, { spaces: 2 });
        console.log('  Created basic tsconfig.json with "cypress" in types');
      } catch (e) {
        console.error('\n❌ Could not create tsconfig.json:', e);
      }
    }

    console.log('\n✅ Cypress project structure created in ./cypress');
    console.log('\nNext steps:');
    console.log('  - Edit cypress.config.ts as needed');
    console.log('  - Run "yarn cypress:open" to launch Cypress\n');
  } catch (err) {
    if (err.code === 'EEXIST') {
      console.error('\n🚫 Some files already exist. Aborting to avoid overwrite. \n');
    } else {
      console.error('\n❌ Error copying template files:', err, '\n');
    }
    process.exit(1);
  }
}

main();
