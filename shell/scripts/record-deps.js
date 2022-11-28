const fs = require('fs');
const path = require('path');

// Script lives in shell/scripts, so work out top-level dir from there
const topDir = path.resolve(__dirname, '..', '..');
const dir = process.cwd();

// Read the package.json file
const topPkgFile = path.join(topDir, 'package.json');
const pkgFile = path.join(dir, 'package.json');

const topPkg = JSON.parse(fs.readFileSync(topPkgFile));
const mainPkg = JSON.parse(fs.readFileSync(pkgFile));

// Look to see if we specify the deps we require
if (mainPkg._requires) {
  // Map each one to the same version as the main package
  const out = {};

  mainPkg._requires.forEach((name) => {
    let ver = topPkg.dependencies?.[name] || topPkg.devDependencies?.[name];

    if (name === '@rancher/components') {
      const componentsPkgFile = path.join(topDir, 'pkg', 'rancher-components', 'package.json');
      const componentsPkg = JSON.parse(fs.readFileSync(componentsPkgFile));

      ver = componentsPkg.version;
    }

    out[name] = ver;
  });

  mainPkg._pkgs = out;
  delete mainPkg._requires;

  fs.writeFileSync(pkgFile, JSON.stringify(mainPkg, null, 2), 'utf-8');
}
