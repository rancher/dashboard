#!/usr/bin/env bash

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
BASE_DIR="$(
  cd $SCRIPT_DIR && cd ../.. &
  pwd
)"
SHELL_DIR=$BASE_DIR/shell/
PUBLISH_ARGS="--no-git-tag-version --access public $PUBLISH_ARGS"

echo "Publishing Shell Packages"

# We use the version from the shell package for the creator packages
# Need to copy them to a temporary location, so we can patch the version number
# before publishing

# To set a token for NPM registry auth: `npm config set //registry.npmjs.org/:_authToken <TOKEN>``

PKG_DIST=$BASE_DIR/dist-pkg/creators
mkdir -p ${PKG_DIST}
rm -rf ${PKG_DIST}/app
rm -rf ${PKG_DIST}/pkg

pushd ${SHELL_DIR} >/dev/null

PKG_VERSION=$(node -p "require('./package.json').version")
popd >/dev/null

echo "Publishing version: $PKG_VERSION"

cp -R ${SHELL_DIR}/creators/app ${PKG_DIST}
cp -R ${SHELL_DIR}/creators/pkg ${PKG_DIST}

sed -i.bak -e "s/\"0.0.0/"\"$PKG_VERSION"/g" ${PKG_DIST}/app/package.json
sed -i.bak -e "s/\"0.0.0/"\"$PKG_VERSION"/g" ${PKG_DIST}/pkg/package.json

rm ${PKG_DIST}/app/package.json.bak
rm ${PKG_DIST}/pkg/package.json.bak

function publish() {
  NAME=$1
  FOLDER=$2

  echo "Publishing ${NAME} from ${FOLDER}"
  pushd ${FOLDER} >/dev/null

  # For now, copy the rancher components into the shell and ship them with it
  if [ "$NAME" == "Shell" ]; then
    echo "Adding Rancher Components"
    rm -rf ${SHELL_DIR}/rancher-components
    cp -R ${BASE_DIR}/pkg/rancher-components/src/components ${SHELL_DIR}/rancher-components/
  fi

  yarn publish . --new-version ${PKG_VERSION} ${PUBLISH_ARGS}
  RET=$?
  popd >/dev/null

  if [ $RET -ne 0 ]; then
    echo "Error publishing package ${NAME}"
    exit $RET
  fi
}

# Publish the packages - don't tag the git repo and don't auto-increment the version number
publish "Shell" ${SHELL_DIR}

publish "Application creator" ${PKG_DIST}/app
publish "Package creator" ${PKG_DIST}/pkg

echo "Done"
