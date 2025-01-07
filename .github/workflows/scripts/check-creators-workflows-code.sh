#!/bin/bash

set -eo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
BASE_DIR="$(
  cd $SCRIPT_DIR && cd ../.. &
  pwd
)"

CREATOR_WORKFLOWS_DIR=$BASE_DIR/creators/extension/app/files/.github/workflows

WORKFLOW_BRANCH=$1

PROPER_WORKFLOW_CHARTS="name: Build and Release Extension Charts

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
    uses: rancher/dashboard/.github/workflows/build-extension-charts.yml@$WORKFLOW_BRANCH
    permissions:
      actions: write
      contents: write
      deployments: write
      pages: write
    with:
      target_branch: gh-pages
      tagged_release: \${{ github.ref_name }}"

PROPER_WORKFLOW_CATALOG="name: Build and Release Extension Catalog

on:
  workflow_dispatch:
  release:
    types: [released]

defaults:
  run:
    shell: bash
    working-directory: ./

jobs:
  build-extension-catalog:
    uses: rancher/dashboard/.github/workflows/build-extension-catalog.yml@$WORKFLOW_BRANCH
    permissions:
      actions: write
      contents: read
      packages: write
    with:
      registry_target: ghcr.io
      registry_user: \${{ github.actor }}
      tagged_release: \${{ github.ref_name }}
    secrets: 
      registry_token: \${{ secrets.GITHUB_TOKEN }}"

cat $CREATOR_WORKFLOWS_DIR/build-extension-charts.yml

if [ "$PROPER_WORKFLOW_CHARTS" == "$(cat $CREATOR_WORKFLOWS_DIR/build-extension-charts.yml)" ] ;then
  echo "build-extension-charts workflow on creator's package is validated. proceeding..."
else
  echo "build-extension-charts workflow wasn't validated correctly! stopping script" 
  exit 1
fi

cat $CREATOR_WORKFLOWS_DIR/build-extension-catalog.yml

if [ "$PROPER_WORKFLOW_CATALOG" == "$(cat $CREATOR_WORKFLOWS_DIR/build-extension-catalog.yml)" ] ;then
  echo "build-extension-catalog workflow on creator's package is validated. All checks done"
else
  echo "build-extension-catalog workflow wasn't validated correctly! stopping script" 
  exit 1
fi
