# Publishing an Extension

There are currently two options for building and publishing a extensions:
1. Building the Helm charts and necessary assets of an extension that can be committed into a Github or Helm repository.
2. Building an [Extension Catalog Image](./advanced/air-gapped-environments) that can be pushed or mirrored into a container registry.

As discussed in the [Getting Started](./extensions-getting-started#creating-a-release) section, we have established [two workflows](https://github.com/rancher/dashboard/tree/master/shell/creators/pkg/files/.github/workflows) that automatically handle the build and publication of both the Helm charts and ECI into the Extension's GitHub repository. However, these workflows can be omitted for a more hands-on approach to publishing Extensions.

> Note: An explanation on the workflow files can be found in the [Additional Release Configuration](#additional-release-configuration) section.

## Publish Script Usage

___Usage___
```console
Usage: yarn publish-pkgs [<options>] [plugins]
 options:
  -s <repo>    Specify destination GitHub repository (org/name) - defaults to the git origin
  -b <branch>  Specify destination GitHub branch
  -t <tag>     Specify the Github release tag to build when a release has been tagged and published
  -f           Force building the chart even if it already exists
  -c           Build as a container image rather than publishing to Github
  -p           Push container images on build
  -r <name>    Specify destination container registry for built images
  -o <name>    Specify destination container registry organization for built images
  -i <prefix>  Specify prefix for the built container image (default: 'ui-extension-')
```

## Manually Publishing the Extension Helm Charts

> Note: Currently, we only support publishing Extension Helm charts into a **public** Github repository, if you inted to deploy an extension from a private repository/registry, we recommend utilizing the [Extension Catalog Image](#manually-publishing-an-extension-catalog-image) method.

Building the Extension into Helm charts with the necessary assets can be accomplished with the `publish-pkgs` script declared in the extension's `package.json`.
Running this script will bundle each extension package as a node.js app, create Helm charts with metadata needed by the [`ui-plugin-operator`](https://github.com/rancher/ui-plugin-operator), and a [Helm repo index](https://helm.sh/docs/helm/helm_repo_index/) to populate the Extension marketplace for installation.

After the Helm assets have been built, you will need to commit them into a publicly accessible Github repository. This repository will then need to be added into the Cluster Repositories list within a Rancher instance, that will then populate the Extension marketplace with the charts built from the previous step.

### Prerequisites

> Note: This has been tested on Linux and MacOS machines

This method requires a few tools to be installed:

- [git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
- [nodejs](https://nodejs.org/en/download) ( >= `12.0.0` < `17.0.0` )
- [yarn](https://yarnpkg.com/getting-started/install)
- [jq](https://stedolan.github.io/jq/)
- [yq](https://github.com/mikefarah/yq/#install) ( >= `4.0.0` )
- [helm](https://helm.sh/docs/intro/install/) ( >= `3.0.0` )

### Running the Publish Script

To start the build, run the `publish-pkgs` script with two options:

| Option | Argument | Description |
| -- | ---- | -------- |
| `-s` | `<repository>` | Specifies the destination GitHub repository (org/name) - defaults to the git origin |
| `-b` | `<branch>` | Specifies destination GitHub branch - defaults to `main` |

Example:

```console
yarn publish-pkgs -s "my-organization/my-extension-repo" -b "production"
```

After running the script, a number of directories will be created:

- `assets` - Contains the packaged Extension charts for each package from `./charts/*` (e.g. `./assets/my-pkg/my-pkg-0.1.0.tgz`), used by the `index.yaml` to obtain the Chart info.
- `charts` - The Extension Charts, includes the `Chart.yaml` and `values.yaml` among other files.
- `extensions` - Contains the minified javascript bundle for the node.js app, targeted by the `.spec.plugin.endpoint` which is used by the `ui-plugin-operator` to load and cache the minified javascript.
- `index.yaml` - The Helm repo index file used by Helm to gather Chart information - this contains the `urls` property that targets the `assets/*` for each package.
- `tmp` - Contains all of the directories and `index.yaml` mentioned which allows for simple aggregation when pushing charts to a repository.

These files will need to be pushed into a publically available Github repository, for example:

```console
git add ./tmp/*
git commit -m 'Adding extension charts'
git push origin production
```

Once the files are accessible on Github, add the repository within the Rancher "local" cluster - The charts will then be available on the Extensions page, under the "Available" tab.

## Manually Publishing an Extension Catalog Image

Publishing an ECI into the registry of your choice can also be accomplished with the `publish-pkgs` script declared in the extension's `package.json`. This script will build a Docker image for each extension package, as well as a Helm chart that can be used to deploy the images. Given the option, the script can automatically push the built images and chart into a specified registry.

### Prerequisites

Publishing an ECI has a few requirements, namely:

- The Extension needs to be bundled into the ECI
- A registry to house the ECI
- Access to this registry within the Cluster

This method also requires a few tools to be installed:

- [make](https://www.gnu.org/software/make/)
- [docker](https://docs.docker.com/get-docker/)
- [go](https://go.dev/dl/)
- [nodejs](https://nodejs.org/en/download) ( >= `12.0.0` < `17.0.0` )
- [yarn](https://yarnpkg.com/getting-started/install)
- [jq](https://stedolan.github.io/jq/)
- [yq](https://github.com/mikefarah/yq/#install) ( >= `4.0.0` )
- [helm](https://helm.sh/docs/intro/install/) ( >= `3.0.0` )

### Running the Publish Script

You can simply run the `publish-pkgs` script with three options:

| Option | Argument | Description |
| -- | ---- | -------- |
| `-c` | | specifies the container build | 
| `-r` | `<registry>` | specifies the registry where the image will be housed |
| `-o` | `<organization>` | specifies the organization namespace for the registry |

Example:

```console
yarn publish-pkgs -c -r <REGISTRY> -o <ORGANIZATION>
```

Running any of the commands above will only build your images - in order to publish the images to your registry you must either push them manually or use the script with the `-p`` option. This will automatically push your images to the designated registry.

```console
yarn publish-pkgs -c -p -r <REGISTRY> -o <ORGANIZATION>
```

## Additional Release Configuration

Depending on your use case, there are multiple options on building and creating releases. When building an extension within a Github repository you have the option of utilizing an action that triggers [prebuilt workflows](https://github.com/rancher/dashboard/tree/master/shell/creators/pkg/files/.github/workflows). When added to your extension the `./github/workflows` directory will contain two files, `build-extension.yml` and `build-container.yml`. These workflows accomplish two seperate build types:

- The `build-extension.yml` workflow builds the Helm charts and necessary assets that are then published to the specified branch (defaults to `gh-pages`).
  - The versioning of these builds is determined by the Extension Package `version` property found in `./pkg/<package-name>/package.json`
- The `build-container.yml` workflow builds and publishes the [Extension Catalog Image](./advanced/air-gapped-environments) (ECI) to the specified registry (defaults to `ghcr.io`), for use with private repositories or air-gapped builds.
  - An ECI contains the Helm charts and assets within the image, and is determined by the main Extension `version` property found in `./package.json`

By default, both of these workflows are triggered by pushing into the `main` branch. This may not be your disired flow, and so you can modify the workflow files to fit your needs.

> Note: For more information on events that trigger workflows, follow the [Github Documentation](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows).

### Triggering a Github Workflow on Tagged Release

The workflows create tagged releases whenever a build is published, this is accomplished by the [`helm/chart-releaser-action`](https://github.com/helm/chart-releaser-action). Instead of having the workflows run before a release is tagged, you can modify the workflow files to be triggered by a [tagged release](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#release). This allows you to push code to the `main` branch and create pre-releases without worrying about the automated builds kicking off.

#### Requirements

When creating a Tagged Release, the tag name ***MUST*** match the proper Extension name depending on the type of build. As it was mentioned above, the Extension Charts (published in the specified branch) and ECI (published in the specified registry) are determined by different versions.

**Proper Tagged Release naming scheme:**
- _**Extension Charts**_: The name ***MUST*** match the Extension Package name (determined by the package directory name) followed by the version.
  - For example: `my-extension-package-0.1.1`
- _**Extension Catalog Image**_: The name ***MUST*** match the main Extension name (determined by the `name` property in `./package.json`) followed by the version
  - For example: `my-extension-0.1.0`

---

#### Workflow Configuration

To configure the workflows you will need to modify two sections, namely the [`on`](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions#on) stanza and the `Run build script` steps.

**Adding the Tagged Release event:**
```yaml
on:
  release:
    types: [released]
```

> Note: A `release` event has multiple `types` to specify, `released` will cause the workflow to only be triggered when a release is published and not considered a pre-release. More info can be found in the [Github documentation](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#release).

**Modify the `yarn publish-pkgs` script**

With a `release` event type configured, you will need to modify the `yarn publish-pkgs` command within the workflow files by appending the option `-t ${{ github.ref_name }}`:

```yaml
  run: yarn publish-pkgs -s "${{ github.repository }}" -b gh-pages -t ${{ github.ref_name }}
```

This will provide the `publish-pkgs` script with the released tag name and ensure only the specified build is accomplished.

#### Extension Chart Workflow Example

An example of modifying the `build-extension.yml` workflow file to build when a tag is released:

```yaml
# .github/workflows/build-extension.yml
name: Build and Release Extension

on:
  release:
    types: [released]
...
jobs:
  build:
    ...
    steps:
      ...

      - name: Run build script
        shell: bash
        id: build_script
        run: |
          yarn publish-pkgs -s "${{ github.repository }}" -b gh-pages -t ${{ github.ref_name }}

```

#### Extension Catalog Image Workflow Example

The same steps apply for the `build-container.yml` workflow file as `${{ github.ref_name }}` will use the commit `ref` name, the release tag in this case, which triggered the action:

```yaml
# .github/workflows/build-container.yml
name: Build and release container to registry

on:
  release:
    types: [released]

env:
  REGISTRY: ghcr.io

jobs:
  build:
    ...
    steps:
      ...

      - name: Build and push UI image
        run: |
          yarn publish-pkgs -cp -r ${{ env.REGISTRY }} -o ${{ github.repository_owner }} -t ${{ github.ref_name }}
```

#### Sequence of Events

Once the modifications have been made to the workflow files, all that is required for a build to be initiated is to create a Release tag with the desired extension to be built. This will then trigger both of the workflows, the `publish-pkgs` script will determine if the provided tag name matches either the main Extension name or one of the Extension packages names.

If the Tagged Release does not match the main Extension name, the ECI build will be canceled. Alternatively, if the Tagged Release name does not match an Extension package name, it will be skipped.
 