# Package Management

NPM Package dependencies can be found in the usual `./package.json` file. There is also `./yarn.lock` which fixes referenced dependency's versions.

Changes to these files should be kept to a minimum to avoid regression for seldom used features (caused by newer dependencies changing and breaking them).

Changes to `./yarn.lock` should be reviewed carefully, specifically to ensure no rogue dependency url is introduced.

## Pinning
All dependencies in any `package.json` should be pinned to a specific patch version

## Restrictions

CI runs `yarn install --immutable` (Yarn Berry). The `--immutable` flag fails the install if `package.json` and `yarn.lock` are out of step, which ensures no malicious or unexpected dependency bump is installed/used in cases where a dependency does not pin to a specific version.

Locally, `yarn install`, `yarn add ...` and `yarn up ...` update `yarn.lock` as needed. Commit the resulting `yarn.lock` changes and review them carefully.
