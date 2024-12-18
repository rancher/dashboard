#!/usr/bin/env bash

set -eo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
BASE_DIR="$(
  cd $SCRIPT_DIR && cd ../.. &
  pwd
)"
SHELL_DIR=$BASE_DIR/shell
CREATORS_DIR=$BASE_DIR/creators/extension

function generate_tag_export() {
  NAME=$1

  case $NAME in
    "shell")
      SHELL_V=$(jq -r .version ${SHELL_DIR}/package.json)
      echo "SHELL_TAG=shell-pkg-v$SHELL_V" >> $GITHUB_OUTPUT
      echo "Shell tag retrieved ::: ${SHELL_V}"
      ;;
    "creators")
      CREATORS_V=$(jq -r .version ${CREATORS_DIR}/package.json)
      echo "CREATORS_TAG=creators-pkg-v$CREATORS_V" >> $GITHUB_OUTPUT
      echo "Creators tag retrieved ::: ${CREATORS_V}"
      ;;
    "extension")
      REPO_NAME=$2
      BRANCH=$3
      EXTENSION=$4
      git clone https://github.com/rancher/$REPO_NAME.git
      pushd ${BASE_DIR}/$REPO_NAME

      git checkout $BRANCH

      ECI_NAME=$(jq -r .name ./package.json)
      ECI_VERSION=$(jq -r .version ./package.json)
      EXTENSION_VERSION=$(jq -r .version pkg/$EXTENSION/package.json)
      ECI_TAG_FULL=$ECI_NAME-$ECI_VERSION
      EXTENSION_TAG_FULL=$EXTENSION-$EXTENSION_VERSION

      echo "ECI_TAG=$ECI_TAG_FULL" >> $GITHUB_OUTPUT
      echo "EXTENSION_TAG=$EXTENSION_TAG_FULL" >> $GITHUB_OUTPUT
      echo "ECI tag retrieved ::: ${ECI_TAG_FULL}"
      echo "Extension tag retrieved ::: ${EXTENSION_TAG_FULL}"

      popd
      ;;
  esac
}

generate_tag_export "shell"
generate_tag_export "creators"
generate_tag_export "extension" "ui-plugin-examples" "main" "clock"