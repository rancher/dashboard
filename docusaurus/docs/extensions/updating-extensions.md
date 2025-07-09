# Updating an Extension

This guide outlines the process for updating Rancher extensions. Depending on the version you're upgrading from and to, different commands are available to streamline the process.

## Prerequisites

Before updating, ensure the following prerequisites are met:
- **Node.js Version:**
  - When updating from **`legacy-v1`** or **`legacy-v2`**, you should use Node.js **version `v16`** (tested with `v16.19.1`).
  - When moving to the latest version (**`v3`**), you should use Node.js **version `v20`** (tested with `v20.17.0`).
- You have the `npm` package manager installed.
- Yarn is installed globally: `npm install -g yarn`.

> Note: Updating an extension is only supported on Mac and Linux. Windows is not currently supported.

---

## Updating from Legacy Versions

### Updating from `legacy-v1` to `legacy-v2`

If you are currently using `legacy-v1`, the update script will transition your extension to `legacy-v2` while ensuring compatibility with the latest dependencies. Run the following command:

```sh
npm init @rancher/extension@legacy-v2 -- --update
```

This command will:

- Update all dependencies to match the @rancher/shell version for legacy-v2.
- Ensure your extension package and skeleton application are aligned with the new structure.

### Updating to v3
When updating to the latest version (v3), a simplified migration script is used. This script handles updates from both legacy-v1 and legacy-v2. Use the following command:

```sh
npm init @rancher/extension -- --migrate
```

This command will:

- Update dependencies.
- Migrate your extension's codebase to the latest structure and practices.
- Highlight any manual changes required for full compatibility.

For detailed logs or dry-run previews, you can add additional options to the migration command, outlined below.

**Migration Options**

| Option              | Description                                                                                     |
| :-----------------: | ----------------------------------------------------------------------------------------------- |
| --dry               | Dry Run Mode: Run the script without making any changes to your files.                          |
| --verbose           | Verbose Output: Enable detailed logging.                                                        |
| --suggest           | Suggest Mode: Generate a 'suggested_changes.diff' file with proposed changes.                   |
| --paths             | Specify Paths: Limit migration to specific paths or files (accepts glob patterns).              |
| --ignore            | Ignore Patterns: Exclude specific files or directories (accepts comma-separated glob patterns). |
| --files             | Output Modified Files: List all files modified during the migration.                            |
| --log               | Generate Log File: Write detailed migration statistics to 'stats.json'.                         |
| --help, -h          | Display the usage and options available.                                                        |

## Post-Update Steps

1. Reinstall Packages: After running the update or migration command, ensure you reinstall all dependencies:

```sh
yarn install
```

2. Test the Updated Extension: Run the extension in development mode to verify functionality:

```sh
API=<Rancher Backend URL> yarn dev
```

Open the browser at `http://localhost:8005` to check the Rancher Dashboard.

3. Review Manual Changes: The update or migration script will log any issues or changes that require manual intervention. Review these carefully to ensure full compatibility.

## Wrap-Up

This guide has provided the steps needed to update a Rancher extension from earlier versions to the latest structure. By using the provided commands and migration options, you can streamline the process and ensure your extension remains compatible with the latest Rancher Dashboard features.