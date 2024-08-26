#!/usr/bin/env bash

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
BASE_DIR="$(
  cd $SCRIPT_DIR && cd ../.. &
  pwd
)"
SHELL_DIR=$BASE_DIR/shell/
PUBLISH_ARGS="--no-git-tag-version --access public $PUBLISH_ARGS"
FORCE_PUBLISH_TO_NPM="false"
DEFAULT_YARN_REGISTRY="https://registry.npmjs.org"

# if TAG doesn't exist, we can exit as it's needed for any type of publish
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
  export YARN_REGISTRY=$DEFAULT_YARN_REGISTRY
fi

# We use the version from the shell package for the creator packages
# Need to copy them to a temporary location, so we can patch the version number
# before publishing

# To set a token for NPM registry auth: `npm config set //registry.npmjs.org/:_authToken <TOKEN>``
PKG_DIST=$BASE_DIR/dist-pkg/creators
mkdir -p ${PKG_DIST}
rm -rf ${PKG_DIST}/extension

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

  yarn publish . --new-version ${PKG_VERSION} ${PUBLISH_ARGS}
  RET=$?

  popd >/dev/null

  if [ $RET -ne 0 ]; then
    echo "Error publishing package ${NAME}"
    exit $RET
  fi
}

# Generate the type definitions for the shell
${SCRIPT_DIR}/typegen.sh

echo "TAG ${TAG}"
  
  # let's get the package name and version from the tag
PKG_NAME=$(sed 's/-pkg-v.*//' <<< "$TAG")
PKG_V=$(sed 's/.*-pkg-v//'<<< "$TAG")

echo "PKG_NAME ${PKG_NAME}"
echo "PKG_V ${PKG_V}"

# version comparison checks
case $PKG_NAME in
  shell)
    echo "Publishing only Shell pkg via tagged release"
    publish "Shell" ${SHELL_DIR} ${PKG_V}
    ;;
  creators)
    echo "Publishing only Creators pkg via tagged release"
    publish "Extension creator" ${PKG_DIST}/extension/ ${PKG_V}
    ;;
  *)
    echo "something went wrong with the tagging name => TAG: ${TAG} , PKG_NAME: ${PKG_NAME}. Admissable names are 'shell' and 'creator'"
    exit 1
    ;;
esac