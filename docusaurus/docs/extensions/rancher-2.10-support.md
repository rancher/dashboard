# Rancher 2.10.0 update

## Breaking Changes in 2.10.0

Following the updates to the Rancher UI, Shell package, and the UI Extensions from Vue2 to Vue3, we have introduced breaking changes to the UI Extensions. These changes require you to update your existing extensions in order to be compliant with the Rancher `2.10` UI framework.

## How to proceed with your extension update

We have developed a migration script that will allow extension developers to easily migrate their extensions to the minimum required setup in order to be compliant with this breaking change.

Notably we update the Shell package to version `3.x.x`, which is now a requirement to be compliant with Rancher `2.10`, but we also update some of the core files of you app skeleton in order to be compatible with the new node version now in use `v20`. To find out more about the support matrix for Shell versions in regards to Rancher versions, check the support matrix [here](./support-matrix#shell-support-matrix).

On top of this, the migration script also does some of the basic changes in terms of syntax needed to work with Vue3. However, please note that this feature is **experimental** and therefore **unsupported** for syntax migration. We recommend familiarizing yourself with the differences between Vue2 and Vue3 by following the official documentation [here](https://v3-migration.vuejs.org/).

To make use of this migration script, you'll just need to run the following command on the root folder of your skeleton app that contains your extensions:

```sh
yarn create @rancher/extension --migrate [OPTIONS]
```

### **_Migration script options_**

There are a few options available to be passed as an argument to the `@rancher/extension --migrate` script:

|          Option           | Description                                                                                                                                                                                                                                                                             |
| :-----------------------: | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|     `--dry`      | Dry Run Mode: Run the script without making any changes to your files.                                                    |
|     `--verbose`      | Verbose Output: Enable detailed logging.                                                    |
|     `--suggest`      | Suggest Mode: Generate a 'suggested_changes.diff' file with proposed changes.                                                    |
|     `--paths=<path>`      | Specify Paths: Limit migration to specific paths or files (accepts glob patterns).                                                    |
|     `--ignore=<patterns>`      | Ignore Patterns: Exclude specific files or directories (accepts comma-separated glob patterns).                                                    |
|     `--files`      | Output Modified Files: List all files modified during the migration.                                                    |
|     `--log`      | Generate Log File: Write detailed migration statistics to 'stats.json'.                                                    |
|     `--help, -h `      | Display this help message and exit.                                                    |

---

## Notable Vue3 syntax changes

These are the most common Vue3 syntax changes that you may encounter on your extensions:

- `v-model` usage update: https://v3-migration.vuejs.org/breaking-changes/v-model.html
- `key` usage change: https://v3-migration.vuejs.org/breaking-changes/key-attribute.html
- `v-bind` merge behaviour: https://v3-migration.vuejs.org/breaking-changes/v-bind.html
- Async components: https://v3-migration.vuejs.org/breaking-changes/async-components.html
- Slots Unification: https://v3-migration.vuejs.org/breaking-changes/slots-unification.html
- `$attrs` includes `class` & `style`: https://v3-migration.vuejs.org/breaking-changes/attrs-includes-class-style.html
- Attribute Coercion Behavior: https://v3-migration.vuejs.org/breaking-changes/attribute-coercion.html#attribute-coercion-behavior
- Inline Template Attribute: https://v3-migration.vuejs.org/breaking-changes/inline-template-attribute.html#inline-template-attribute

## New mandatory annotation

One of the new changes that we've introduced is that for a published extension to be loaded into a Rancher `2.10` system, the published helm chart for a particular version **must** include the `catalog.cattle.io/ui-extensions-version` annotation, being the minimum version needed `>= 3.0.0`. We also recommend to set a maximum of `< 4.0.0` on this new annotation.

We also recommend that you update the `catalog.cattle.io/rancher-version` to `>= 2.10.0`.

You should check that your extension `pkg/<-YOUR EXTENSION->/package.json` shows something similar to:

```json
{
  "name": "your-extension",
  "description": "your-extension description",
  "version": "1.2.1",
  "rancher": {
    "annotations": {
      "catalog.cattle.io/rancher-version": ">= 2.10.0",
      "catalog.cattle.io/ui-extensions-version": ">= 3.0.0 < 4.0.0"
    }
  },
  ....
}
```

## How to maintain different extension versions

In terms of development procedure, we recommend branching your extension repository to manage compatibility with both Rancher 2.9 and Rancher 2.10, if your extension is impacted by version-specific changes.

You can check the example of `Elemental` where branch `main` is tracking the **Rancher 2.10 compliant version** and `release-2.9.x` branch is tracking everything Rancher "2.9".

The difference between the two branches are some annotations and of course the shell versions being used.

`main`
- https://github.com/rancher/elemental-ui/blob/main/pkg/elemental/package.json#L6-L12
- https://github.com/rancher/elemental-ui/blob/main/package.json#L10

vs `release-2.9.x`
- https://github.com/rancher/elemental-ui/blob/release-2.9.x/pkg/elemental/package.json#L6-L12
- https://github.com/rancher/elemental-ui/blob/release-2.9.x/package.json#L11


The workflow we offer for Github to build and release extensions to the `gh-pages` branch https://extensions.rancher.io/extensions/publishing#triggering-a-github-workflow-on-tagged-release will work just fine, but when doing a tagged release you’ll need to mindful of the target branch you want to release from.

![Release target branch](./screenshots/target-branch.png)

Picking up on the Elemental example, to release a Rancher 2.9 compliant version, we would need to target the `release-2.9.x` branch (with the appropriate tag format ex: `elemental-1.3.1-rc9` which is `extensionName-extensionVersion` ) and for Rancher 2.9 you would target the `main` branch as one would normally do in an extension release. We recommend that you don’t trigger both releases at the same time (let one finish first, then trigger the other release).