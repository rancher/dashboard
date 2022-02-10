const fs = require('fs');

console.log('Updating package file'); // eslint-disable-line no-console

if (process.argv.length !== 3) {
  console.error('No enough args'); // eslint-disable-line no-console

  return;
}

const pkgFilepath = process.argv[process.argv.length - 1];
const pkg = require(pkgFilepath);

// Ensure we have the keys we need

pkg.files = ['**/*'];
pkg.rancher = true;
pkg.main = `${ pkg.name }-${ pkg.version }.umd.min.js`;

delete pkg.scripts;
delete pkg.browserslist;

fs.writeFileSync(pkgFilepath, JSON.stringify(pkg, null, 2));
