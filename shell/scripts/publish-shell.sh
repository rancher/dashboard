#!/usr/bin/env bash

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
BASE_DIR="$(
  cd $SCRIPT_DIR && cd ../.. &
  pwd
)"
SHELL_DIR=$BASE_DIR/shell/
TMP_DIR=$BASE_DIR/tmp
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
rm -rf ${PKG_DIST}/app
rm -rf ${PKG_DIST}/pkg
rm -rf ${PKG_DIST}/update

pushd ${SHELL_DIR} >/dev/null

PKG_VERSION=$(node -p "require('./package.json').version")
popd >/dev/null

echo "Publishing version: $PKG_VERSION"

cp -R ${SHELL_DIR}/creators/app ${PKG_DIST}
cp -R ${SHELL_DIR}/creators/pkg ${PKG_DIST}
cp -R ${SHELL_DIR}/creators/update ${PKG_DIST}

sed -i.bak -e "s/\"0.0.0/"\"$PKG_VERSION"/g" ${PKG_DIST}/app/package.json
sed -i.bak -e "s/\"0.0.0/"\"$PKG_VERSION"/g" ${PKG_DIST}/pkg/package.json
sed -i.bak -e "s/\"0.0.0/"\"$PKG_VERSION"/g" ${PKG_DIST}/update/package.json

rm ${PKG_DIST}/app/package.json.bak
rm ${PKG_DIST}/pkg/package.json.bak
rm ${PKG_DIST}/update/package.json.bak

function publish() {
  NAME=$1
  FOLDER=$2

  echo "Publishing ${NAME} from ${FOLDER}"
  pushd ${FOLDER} >/dev/null

  # For now, copy the rancher components into the shell and ship them with it
  if [ "$NAME" == "Shell" ]; then
    echo "Adding Rancher Components"
    cp -R ${BASE_DIR}/pkg/rancher-components/src/components ./rancher-components/
  fi

  if [ "$NAME" == "Update" ]; then
    # Add files from the app and pkg creators to the update package
    mkdir -p ./app
    mkdir -p ./pkg
    cp -R ${BASE_DIR}/shell/creators/app/* ./app
    cp -R ${BASE_DIR}/shell/creators/pkg/* ./pkg
    # Remove index.ts from pkg files, as we don't want to replace that
    rm -f ./pkg/files/index.ts

    # Update the package.json for the app
    cd app
    node ${SCRIPT_DIR}/record-deps.js
    cd ..
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

# Publish the packages - don't tag the git repo and don't auto-increment the version number
publish "Shell" ${SHELL_DIR}
publish "Application creator" ${PKG_DIST}/app/
publish "Package creator" ${PKG_DIST}/pkg/
publish "Update" ${PKG_DIST}/update/

echo "Done"


