# Package Management

NPM Package dependencies can be found in the usual `./package.json` file. There is also `./yarn.lock` which fixes referenced dependency's versions.

Changes to these files should be kept to a minimum to avoid regression for seldom used features (caused by newer dependencies changing and breaking them).

Changes to `./yarn.lock` should be reviewed carefully, specifically to ensure no rogue dependency url is introduced.

## Pinning
All dependencies in any `package.json` should be pinned to a specific patch version

## Restrictions

We use a `./.yarnrc` file to ensure all `yarn install` commands use `--frozen-lockfile`. This ensures that no malicious dependency bump is installed/used in cases where a dependency does not pin to a specific version.

This does mean changes to the lock file that include `yarn install` (install, add, upgrade) need special treatment. Either

- Run the command with special targets
  - use `yarn run add:no-lock ...` instead of `yarn add`
  - use `yarn run upgrade:no-lock ...` instead of `yarn upgrade`
- Run the command with `--no-default-rc`
- Temporarily remove `--frozen-lockfile true` from the lock file
