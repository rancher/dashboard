# Migration to Vue3

Migration of Rancher plugins can be easily done using the migration script. This will ensure all the updates and highlights manual changes required to be done.

- Run script `./node_modules/.bin/@rancher/dashboard migrate` to migrate files from Vue2 to Vue3
- Update NVM/Node version to 20.0.0 (current pointed version)
- Reinstall the packages to fetch the newer versions with `yarn`
- Run unit test upgrade tool `npx vue-upgrade-tool --files 'shell/**/*.test.ts'`
- Run linter with auto-fix flag `yarn lint --fix`
- Manually review logged issues, the script is not aimed to convert 100% of the code

At this point the plugin should be Vue3 compatible.

## Migration Options

The migration script supports several options to customize the update process:

| Option              | Description                                                                                     |
| :-----------------: | ----------------------------------------------------------------------------------------------- |
| --dry               | Dry Run Mode: Run the script without making any changes to your files.                          |
| --verbose           | Verbose Output: Enable detailed logging.                                                        |
| --suggest           | Suggest Mode: Generate a 'suggested_changes.diff' file with proposed changes.                   |
| --paths             | Specify Paths: Limit migration to specific paths or files (accepts glob patterns).              |
| --ignore            | Ignore Patterns: Exclude specific files or directories (accepts comma-separated glob patterns). |
| --files             | Output Modified Files: List all files modified during the migration.                            |
| --log               | Generate Log File: Write detailed migration statistics to 'stats.json'.                         |
|--help, -h           | Display this help message and exit.                                                             |
