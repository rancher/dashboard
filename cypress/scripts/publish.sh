#!/usr/bin/env bash

set -eo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
BASE_DIR="$(cd $SCRIPT_DIR && cd ../.. && pwd)"
CYPRESS_DIR=$BASE_DIR/cypress/
FORCE_PUBLISH_TO_NPM="false"
DEFAULT_NPM_REGISTRY="https://registry.npmjs.org"
# Extract version from TAG
PKG_VERSION="${TAG#cypress-pkg-v}"

# if TAG doesn't exist, we can exit as it's needed for any type of publish.
if [ -z "$TAG" ]; then
  echo "Missing TAG environment variable"
  exit 1
fi

# if TAG does not start with cypress-pkg-v we can exit as it's needed for any type of publish.
if [[ "$TAG" != cypress-pkg-v* ]]; then
  echo "TAG does not start with cypress-pkg-v, skipping publish"
  exit 0
fi

# Check if extracted version is equal to the package version in package.json
PKG_VERSION_IN_PKG_JSON=$(jq -r '.version' "$CYPRESS_DIR/package.json")
if [ "$PKG_VERSION" != "$PKG_VERSION_IN_PKG_JSON" ]; then
  echo "Version mismatch: TAG version ($PKG_VERSION) does not match package.json version ($PKG_VERSION_IN_PKG_JSON), skipping publish"
  exit 1
fi

if [ ! -d "${CYPRESS_DIR}/node_modules" ]; then
  echo "Missing node_modules in cypress/. Please run 'yarn install' in the root directory first."
  exit 1
fi

if [ "$1" == "--npm" ]; then
  FORCE_PUBLISH_TO_NPM="true"
fi

if [ "$FORCE_PUBLISH_TO_NPM" == "true" ]; then
  export NPM_REGISTRY=$DEFAULT_NPM_REGISTRY
fi

echo "Publishing @rancher/cypress package..."
echo ""
echo "TAG: $TAG"
echo "BASE_DIR: $BASE_DIR"
echo "CYPRESS_DIR: $CYPRESS_DIR"
echo "NPM_REGISTRY: $NPM_REGISTRY"
echo "FORCE_PUBLISH_TO_NPM: $FORCE_PUBLISH_TO_NPM"
echo ""

PUBLISH_ARGS="--no-git-tag-version --access public --registry $NPM_REGISTRY"

# Update the version in dist/package.json to match the pkg version
echo "Setting package version to ${PKG_VERSION}"
echo ""
jq --arg ver "$PKG_VERSION" '.version = $ver' ./dist/package.json > ./dist/package.tmp.json && mv ./dist/package.tmp.json ./dist/package.json

# if the PKG_VERSION has a - it means it will be a pre-release
if [[ $PKG_VERSION == *"-"* ]]; then
PUBLISH_ARGS="$PUBLISH_ARGS --tag pre-release"
fi

echo "Publish ${PKG_VERSION} with arguments: ${PUBLISH_ARGS}"
echo ""

cd ./dist
npm publish ${PUBLISH_ARGS}
RET=$?

if [ $RET -ne 0 ]; then
echo "Error publishing package @rancher/cypress version ${PKG_VERSION}"
exit $RET
fi
