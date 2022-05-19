#!/usr/bin/env bash

SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
BASE_DIR="$( cd $SCRIPT_DIR && cd ../.. & pwd)"
SHELL_DIR=$BASE_DIR/shell/

PKG_DIST=${BASE_DIR}/dist-pkg/${1}

if [ -d "${PKG_DIST}" ]; then
  echo "Publishing UI Package $1"

  pushd ${PKG_DIST}
  yarn publish . --no-git-tag-version
  popd
fi



