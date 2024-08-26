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

# if TAG doesn't exist, then we are on one of the other flows that use publish-shell
# which require the overwrite of the released version of the creators package
if [ -z "$TAG" ]; then
  PKG_VERSION=$(node -p "require('./package.json').version")
  popd >/dev/null

  echo "Publishing shell and creators pkg with same version: $PKG_VERSION"

  cp -R ${SHELL_DIR}/creators/extension ${PKG_DIST}

  sed -i.bak -e "s/\"0.0.0/"\"$PKG_VERSION"/g" ${PKG_DIST}/extension/package.json

  rm ${PKG_DIST}/extension/package.json.bak
fi

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

  if [ "$NAME" == "Update" ]; then
    # Add files from the app and pkg creators to the update package
    mkdir -p ./extension
    cp -R ${BASE_DIR}/shell/creators/extension/* ./extension
    # Remove index.ts from pkg files, as we don't want to replace that
    rm -f ./extension/pkg/files/index.ts

    # Update the package.json for the extension
    cd extension
    node ${SCRIPT_DIR}/record-deps.js
    cd ..
  fi

  # Make a note of dependency versions, if required
  node ${SCRIPT_DIR}/record-deps.js

  # yarn publish . --new-version ${PKG_VERSION} ${PUBLISH_ARGS}
  RET=$?

  popd >/dev/null

  if [ $RET -ne 0 ]; then
    echo "Error publishing package ${NAME}"
    exit $RET
  fi
}

# Generate the type definitions for the shell
${SCRIPT_DIR}/typegen.sh


# Since the publish-shell script is used in a couple of different places
# we have to be careful not to disrupt it's logic too much
# otherwise we risk breaking those other flows

# if tag exists, then we call the publish we need with an extra argument
# this is the path of the release-shell-pkg workflow
if [ -n "$TAG" ]; then
  echo "TAG ${TAG}"
  # let's get the package name
  # first step string split
  IFS='-pkg-v'

  read -r TEMP_STR <<<$TAG

  echo "TEMP_STR ${TEMP_STR}"

  # final step string split
  IFS=' '

  read -r PKG_NAME PKG_V <<<$TEMP_STR

  echo "PKG_NAME ${PKG_NAME}"
  echo "PKG_V ${PKG_V}"

  # there can only be two types of tags, which have been verified in the workflow
  # with the "Check Tags Version Matching" step in the workflow
  if [ "$PKG_NAME" == "shell" ]; then
    echo "Publishing only Shell pkg via tagged release"
    publish "Shell" ${SHELL_DIR} ${PKG_V}
  else
    echo "Publishing only Creators pkg via tagged release"
    publish "Extension creator" ${PKG_DIST}/extension/ ${PKG_V}
  fi
else
  # other workflows...
  # Publish the packages - don't tag the git repo and don't auto-increment the version number
  publish "Shell" ${SHELL_DIR}
  publish "Extension creator" ${PKG_DIST}/extension/

  echo "Done"
fi



