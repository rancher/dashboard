#!/usr/bin/env bash

set -eo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
BASE_DIR="$(cd $SCRIPT_DIR && cd ../.. && pwd)"
SHELL_DIR=$BASE_DIR/shell/
CREATORS_DIR=$BASE_DIR/creators/extension
FORCE_PUBLISH_TO_NPM="false"
DEFAULT_NPM_REGISTRY="https://registry.npmjs.org"

# if TAG doesn't exist, we can exit as it's needed for any type of publish.
if [ -z "$TAG" ]; then
  echo "You need to set the TAG variable first!"
  exit 1
fi

if [ ! -d "${BASE_DIR}/node_modules" ]; then
  echo "You need to run 'yarn install' first"
  exit 1
fi

echo "Publishing Shell Packages"

if [ "$1" == "--npm" ]; then
  FORCE_PUBLISH_TO_NPM="true"
fi

if [ "$FORCE_PUBLISH_TO_NPM" == "true" ]; then
  export NPM_REGISTRY=$DEFAULT_NPM_REGISTRY
fi

PUBLISH_ARGS="--no-git-tag-version --access public --registry $NPM_REGISTRY"

pushd ${SHELL_DIR} >/dev/null

function publish() {
  NAME=$1
  FOLDER=$2

  # if we pass a third arg, that is the version number
  # that we want to actually publish on NPM
  # they should match with the package.json version stated 
  # because of the check in the "Check Tags Version Matching" step in the workflow
  if [ -n "$3" ]; then
    PKG_VERSION=$3
  fi

  # if the PKG_VERSION has a - it means it will be a pre-release
  if [[ $PKG_VERSION == *"-"* ]]; then
    PUBLISH_ARGS="$PUBLISH_ARGS --tag pre-release"
  fi

  # when testing the workflow, we don't want to actually do an npm publish but only a dry run
  if [ ${DRY_RUN} == "true" ]; then
    PUBLISH_ARGS="$PUBLISH_ARGS --dry-run"
  fi

  echo "Publish to NPM - arguments ::: ${PUBLISH_ARGS}"

  echo "Publishing ${NAME} from ${FOLDER}"
  pushd ${FOLDER} >/dev/null

  # For now, copy the rancher components into the shell and ship them with it
  if [ "$NAME" == "Shell" ]; then
    echo "Adding Rancher Components"
    rm -rf ./rancher-components
    cp -R ${BASE_DIR}/pkg/rancher-components/src/components ./rancher-components/
  fi

  # Make a note of dependency versions, if required
  node ${SCRIPT_DIR}/record-deps.js

  echo "Publishing to registry: $NPM_REGISTRY"

  npm publish ${PUBLISH_ARGS}
  RET=$?

  popd >/dev/null

  if [ $RET -ne 0 ]; then
    echo "Error publishing package ${NAME}"
    exit $RET
  fi
}

echo "TAG ${TAG}"
  
  # let's get the package name and version from the tag
PKG_NAME=$(sed 's/-pkg-v.*//' <<< "$TAG")
PKG_V=$(sed 's/.*-pkg-v//'<<< "$TAG")

echo "PKG_NAME ${PKG_NAME}"
echo "PKG_V ${PKG_V}"

# Generate the type definitions for the shell
if [ ${PKG_NAME} == "shell" ]; then
  ${SCRIPT_DIR}/typegen.sh
fi

# version comparison checks
case $PKG_NAME in
  "shell")
    echo "Publishing only Shell pkg via tagged release"
    publish "Shell" ${SHELL_DIR} ${PKG_V}
    ;;
  "creators")
    echo "Publishing only Creators pkg via tagged release"
    publish "Extension creator" ${CREATORS_DIR} ${PKG_V}
    ;;
  *)
    echo "something went wrong with the tagging name => TAG: ${TAG} , PKG_NAME: ${PKG_NAME}. Admissable names are 'shell' and 'creator'"
    exit 1
    ;;
esac