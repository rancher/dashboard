# Publishing an Extension

There are currently two options for building and publishing a extensions:

1. Building the Helm charts and necessary assets of an extension that can be committed into a Github or Helm repository.
2. Building an [Extension Catalog Image](./advanced/air-gapped-environments) that can be pushed or mirrored into a container registry.

As discussed in the [Getting Started](./extensions-getting-started#creating-a-release) section, we have established a [workflow](https://github.com/rancher/dashboard/tree/master/creators/extension/app/files/.github/workflows) using [Github reusable workflows](https://docs.github.com/en/actions/using-workflows/reusing-workflows), that automatically handles the build and publication of both the Helm charts and ECI into the Extension's GitHub repository. However, this workflow can be omitted for a more hands-on approach to publishing Extensions.

> Note: An explanation on the workflow files can be found in the [Additional Release Configuration](#additional-release-configuration) section.

## Automatic Approach - Triggering a Github Workflow on Tagged Release

> **WARNING:** When using the provided Github workflows, the base skeleton application name (Found in the root level `package.json`) ___MUST___ be unique when compared with any extension packages found in `./pkg/*`. If an extension package name matches the base skeleton name the workflow will fail due to the "Parse Extension Name" step found in both the ["Build and Release Extension Charts"](https://github.com/rancher/dashboard/blob/422823e2b6868191b9bb33470e99e69ff058b72b/.github/workflows/build-extension-charts.yml#L59-L65) and ["Build and release Extension Catalog Image to registry"](https://github.com/rancher/dashboard/blob/422823e2b6868191b9bb33470e99e69ff058b72b/.github/workflows/build-extension-catalog.yml#L64-L70) workflows.

If your extensions repository doesn't include a github workflow to automate the publishing procedure (ignore this step if you have it already), you can create one in `.github/workflows/build.yaml` on your extension folder, with the following content:

```yaml
name: Build and Release Extension Charts

on:
  workflow_dispatch:
  release:
    types: [released]

defaults:
  run:
    shell: bash
    working-directory: ./

jobs:
  build-extension-charts:
    uses: rancher/dashboard/.github/workflows/build-extension-charts.yml@master
    permissions:
      actions: write
      contents: write
      deployments: write
      pages: write
    with:
      target_branch: gh-pages
      tagged_release: ${{ github.ref_name }}
```

This will leverage the usage of our reusable workflow and give your Github extension repo the ability to publish to the `gh-pages` branch via a **Tagged Release**. 

It's mandatory that release type is **Tagged Release**, otherwise the `build-extension-charts.yml` workflow won't run properly, which is crucial for the success of the publish operation.

When creating a Tagged Release, the tag name **_MUST_** match the proper Extension name depending on the type of build. As it was mentioned above, the Extension Charts (published in the specified branch) and ECI (published in the specified registry) are determined by different versions.

### Proper Tagged Release naming scheme to build Extension Charts

- The name **_MUST_** match the Extension Package folder name (`./pkg/<-YOUR-EXT-DIR->`), followed by the version (determined by the `version` property in `./pkg/<-YOUR-EXT-DIR->/package.json`). 

  If the extension folder in named **my-awesome-extension** and the `version` property value in `./pkg/<-YOUR-EXT-DIR->/package.json` is **1.2.3**, then a correct tag to build the Extension Helm Chart would be: `my-awesome-extension-1.2.3`

### Proper Tagged Release naming scheme to build Extension Catalog Image

The name **_MUST_** match the main Extension name (determined by the `name` property in `./package.json`) followed by the version (determined by the `name` property in `./package.json`). 
  
  If the `name` property in `./package.json` is **my-extension** and the `version` property is **8.0.1**, then a correct tag to build the Catalog Image would be: `my-extension-8.0.1`

---


## Manual Approach - Publish Script Usage

**_Usage_**

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
  -l           Specify Podman container build
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

### Running the Publish Script to generate the extension Helm Chart

To start the build, run the `publish-pkgs` script with two options:

| Option | Argument       | Description                                                                         |
| ------ | -------------- | ----------------------------------------------------------------------------------- |
| `-s`   | `<repository>` | Specifies the destination GitHub repository (org/name) - defaults to the git origin |
| `-b`   | `<branch>`     | Specifies destination GitHub branch - defaults to `main`                            |

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

### Running the Publish Script for a Catalog Image

You can simply run the `publish-pkgs` script with three options:

| Option | Argument         | Description                                           |
| ------ | ---------------- | ----------------------------------------------------- |
| `-c`   |                  | specifies the container build                         |
| `-r`   | `<registry>`     | specifies the registry where the image will be housed |
| `-o`   | `<organization>` | specifies the organization namespace for the registry |

Example:

```console
yarn publish-pkgs -c -r <REGISTRY> -o <ORGANIZATION>
```

Running any of the commands above will only build your images - in order to publish the images to your registry you must either push them manually or use the script with the `-p`` option. This will automatically push your images to the designated registry.

```console
yarn publish-pkgs -c -p -r <REGISTRY> -o <ORGANIZATION>
```

## Additional Release Configuration

Depending on your use case, there are multiple options on building and creating releases. When building an extension within a Github repository, you have the option of utilizing an action that triggers [prebuilt workflows](https://github.com/rancher/dashboard/tree/master/creators/extension/app/files/.github/workflows). When added to your extension, the `./github/workflows` directory will contain the files: `build-extension-charts.yml` and `build-extension-catalog.yml`. These workflows accomplish two seperate actions:

- `build-extension-charts` - Builds the Helm charts and necessary assets that are then published to the specified branch (defaults to `gh-pages`).
  - The versioning of these builds is determined by the Extension Package `version` property found in `./pkg/<package-name>/package.json`
  - Find the resuable workflow file [here](https://github.com/rancher/dashboard/blob/master/.github/workflows/build-extension-charts.yml)
- `build-extension-catalog` - Builds and publishes the [Extension Catalog Image](./advanced/air-gapped-environments) (ECI) into the specified registry (defaults to `ghcr.io`), for use with private repositories or air-gapped builds.
  - An ECI contains the Helm charts and assets within the image, and is determined by the main Extension `version` property found in `./package.json`
  - Find the reusable workflow file [here](https://github.com/rancher/dashboard/blob/master/.github/workflows/build-extension-catalog.yml)

By default, both of these actions are triggered by pushing into the `main` branch. This may not be your disired flow, and so you can modify the workflow file to fit your needs.

> Note: Addition configuration information on the workflows can be found in the [Workflow Configuration](./advanced/workflow-configuration.md) section.

> Note: For more information on events that trigger workflows, follow the [Github Documentation](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows).

## GitLab Integration

When building an extension that will be housed in a GitLab repository or hosted environment, there is only one option for publishing automatically - That is by utilizing the provided [GitLab Pipeline CI file](https://github.com/rancher/dashboard/blob/master/creators/extension/app/files/.gitlab-ci.yml) that is generated when [creating the skeleton app](extensions-getting-started#creating-the-skeleton-app).

This pipeline will build an ECI and publish it to container registry (`registry.gitlab.com` by default) to allow for importing into Rancher Manager.
The actual pipeline jobs are defined in the [Dashboard repo](https://github.com/rancher/dashboard/blob/master/.gitlab/workflows/build-extension-catalog.gitlab-ci.yml) to allow for proper versioning and to apply any updates to the pipeline without any additional work from the Extension developer.

> **_WARNING:_** Ensure the branch of `rancher/dashboard` in the `remote` url containing the reusable workflow matches the release version of your `@rancher/shell` npm dependency. For example:
> - If building for Rancher `v2.9`:
> ```yaml
> #.gitlab-ci.yml
> ...
> include:
> - remote: 'https://raw.githubusercontent.com/rancher/dashboard/release-2.9/shell/scripts/.gitlab/workflows/build-extension-catalog.gitlab-ci.yml'
> ```
> - If building for Rancher `v2.8`:
> ```yaml
> #.gitlab-ci.yml
> ...
> include:
> - remote: 'https://raw.githubusercontent.com/rancher/dashboard/release-2.8/shell/scripts/.gitlab/workflows/build-extension-catalog.gitlab-ci.yml'
> ```

### Pipeline Configuration

There are a few pipeline configuration options, mostly tied to the container registry:

|      Variable       |                 Default                  | Description                                                                   |
| :-----------------: | :--------------------------------------: | ----------------------------------------------------------------------------- |
|     `REGISTRY`      |              `$CI_REGISTRY`              | The Container Registry address where the ECI will be published.               |
|   `REGISTRY_USER`   |           `$CI_REGISTRY_USER`            | The username to push the ECI to the Container Registry.                       |
| `REGISTRY_PASSWORD` |         `$CI_REGISTRY_PASSWORD`          | The password to push the ECI to the Container Registry.                       |
|  `IMAGE_NAMESPACE`  | `$CI_PROJECT_NAMESPACE/$CI_PROJECT_NAME` | Refers to the unique location within the Container Registry to store the ECI. |

> **_WARNING:_** The default values for this configuration will **only** be available if the Container Registry is enabled for the project.

> **Note:** You can find a list of the Predefined Variables in the [GitLab Documentation](https://docs.gitlab.com/ee/ci/variables/predefined_variables.html), this is where the default values used above can be found.

### Sequence of Events

The Pipeline will run automatically when a change to the root level `package.json` has been detected, which will first trigger the `check_version` stage to check for any version collisions within the specified Container Registry. If this stage is successful, the stage `build_catalog` will then build and release the ECI to the Container Registry.

Once the ECI has been published to the Container Registry, it can then be imported into the Rancher UI by following the steps in the [Importing section](./advanced/air-gapped-environments#importing-the-extension-catalog-image).

