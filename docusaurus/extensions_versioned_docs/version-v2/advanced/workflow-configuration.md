# Github Workflow Configuration

## Extension Charts Workflow

To build the charts needed to provide a Helm repository, use the reusable workflow job found [here](https://github.com/rancher/dashboard/blob/master/.github/workflows/build-extension-charts.yml). When published you will be able to target the Github repository as a Helm repository, which will serve the charts for installation within the Rancher Dashboard.

## Workflow Permissions

Each workflow requires permissions to be set correctly to complete the release processes, both builds have specific needs with some overlap:

| Property | Extension Type | Permission | Description |
| -------- | :---: | :---: | ----------------- |
| `actions` | Charts/Catalog | `write` | Requires `write` to [cancel a workflow](https://docs.github.com/en/rest/actions/workflow-runs?apiVersion=2022-11-28#cancel-a-workflow-run). |
| `contents` | Charts*/Catalog | `write`*/`read` | Requires `read` for `actions/checkout`, and requires `write` (*only necessary in the Chart Build workflow) to `put` the contents of the built extension charts [into a branch](https://docs.github.com/en/rest/repos/contents?apiVersion=2022-11-28#create-or-update-file-contents). |
| `deployments` | Charts | `write` | Requires `write` when [deploying `gh-pages`](https://docs.github.com/en/rest/deployments/deployments?apiVersion=2022-11-28#create-a-deployment). |
| `packages` | Catalog | `write` | Requires `write` when a catalog image is created to [create the package](https://docs.github.com/en/packages/managing-github-packages-using-github-actions-workflows/publishing-and-installing-a-package-with-github-actions#publishing-a-package-using-an-action). |
| `pages` | Charts | `write` | Requires write to [request and create page builds](https://docs.github.com/en/rest/pages/pages?apiVersion=2022-11-28#request-a-github-pages-build) for the deployment. |

### Extension Chart Inputs

| Property | Required | Description |
| -------- | :---: | -----------------|
| `permissions` | `true` | This gives the workflow permissions to checkout, build, and push to the repository. |
| `target_branch` | `true` | The Github branch target for the extension build assets |
| `tagged_release` | `false` | Specifies the tag name when triggering workflows by publishing tagged releases. (Requires alternate dispatch rules) |

### Example usage

```yml
...
jobs:
  build-extension-charts:
    name: Build and release Extension charts
    uses: rancher/dashboard/.github/workflows/build-extension-charts.yml@master
    permissions:
      actions: write
      contents: write
      deployments: write
      pages: write
    with:
      target_branch: gh-pages
```

## Extension Catalog Image Workflow

To build an Extension Catalog Image (ECI) for air-gapped/private repositories, use the workflow found [here](https://github.com/rancher/dashboard/blob/master/.github/workflows/build-extension-catalog.yml). This will build and push the container image push into the specified registry.

### Extension Catalog Image Inputs

| Property | Required | Description |
| -------- | :---: | -----------------|
| `permissions` | `true` | This gives the workflow permissions to checkout, build, and push to the registry. |
| `registry_target` | `true` | The container registry to publish the catalog image |
| `registry_user` | `true` | The username connected to the container registry |
| `tagged_release` | `false` | Specifies the tag name when triggering workflows by publishing tagged releases. (Requires alternate dispatch rules) |
| `registry_token` | `true` | The password or token used to authenticate with the registry |

### Example Usage

```yml
...
jobs:
  build-extension-catalog:
    name: Build and release Extension Catalog Image
    uses: rancher/dashboard/.github/workflows/build-extension-catalog.yml@master
    permissions:
      actions: write
      contents: read
      packages: write
    with:
      registry_target: ghcr.io
      registry_user: ${{ github.actor }}
    secrets: 
      registry_token: ${{ secrets.GITHUB_TOKEN }}

```

## Versioning

Each workflow is targeting the `master` branch of [`rancher/dashboard`](https://github.com/rancher/dashboard) by default. Depending on your `@rancher/shell` and Rancher instance versions, you will need to target the branch per release. For example, if running a Rancher instance version `v2.7.7`, you will need to target the `release-2.7.7` branch:

```yml
...
jobs:
  build-extension-charts:
    name: Build and release Extension charts
    uses: rancher/dashboard/.github/workflows/build-extension-charts.yml@release-2.7.7
```

> **Warning:** The reusable workflow was created after Rancher `v2.7.5` - this means you will **NOT** be able to use these workflow files with this release or any previous releases.

## Dispatching Configuration

As mentioned in the `tagged_release` property description, in order to have the workflow triggered by published releases the dispatch will need to be updated. 
This topic is covered in the [Publishing section](../publishing#triggering-a-github-workflow-on-tagged-release). To be concise, update the dispatch within the workflow file to execute the workflow on the `released` event of a `release` action:"

```yml
on:
  release:
    types: [released]
```

This will ensure that the workflow is only triggered when the tagged release is published and is _not_ a draft release. 

Extensive information on how to trigger workflows can be found in the [Github documentation](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows).
