# Known issues

## Problem with reusable workflow @master

With the need to update the reusable workflow extensions use in `master`, the workflow that is shipped with all extensions is now broken:

**Old/current workflow**

```
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

The fix is to add `pull-requests: write` permissions to the workflow, like:

**Updated workflow**

```
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
      pull-requests: write
    with:
      target_branch: gh-pages
      tagged_release: ${{ github.ref_name }}
```

With this fix you can release you extensions as Helm Charts without any problems. Releasing Image Catalog's should not be affected.

## For Shell v1 and v2

- Running `yarn install` might throw the following error:
```
error glob@10.4.3: The engine "node" is incompatible with this module
```

To resolve this add the following `resolution` to the root application's `package.json`:
```
{
  "name": "app-name",
  "version": "0.1.0",
  ...
  resolutions": {
    "glob": "7.2.3"
  },
  ...
}
```

- Running `yarn install` might throw the following errors:
```
error @aws-sdk/types@3.723.0: The engine "node" is incompatible with this module. Expected version ">=18.0.0". Got "16.20.2"
error @aws-sdk/util-locate-window@3.723.0: The engine "node" is incompatible with this module. Expected version ">=18.0.0". Got "16.20.2"
```

To resolve this add the following `resolutions` to the root application's `package.json`:
```
{
  "name": "app-name",
  "version": "0.1.0",
  ...
  resolutions": {
    "@aws-sdk/types": "3.714.0",
    "@aws-sdk/util-locate-window": "3.693.0"
  },
  ...
}
```
