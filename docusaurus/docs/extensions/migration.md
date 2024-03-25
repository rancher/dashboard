# Migration to Vue3

Migration of Rancher plugins can be easily done using the migration script. This will ensure all the updates and highlights manual changes required to be done.

- Run script `node ./scripts/vue-migrate.js` to migrate files from Vue2 to Vue3
- Update NVM/Node version to 20.0.0 or higher
- Reinstall the packages to fetch the newer versions with `yarn`
- Run linter with auto-fix flag `yarn lint --fix`
- Manually review logged issues

At this point the plugin should be Vue3 compatible.

Allowed flags for the migration script:

- `--files`, list all the files
- `--log`, create a `stats.json` log file in the root
- `--dry`, run script without modify files, e.g. for log preview
- `--verbose`, print all the changes in console
