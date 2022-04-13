#!/usr/bin/env bash

SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
BASE_DIR="$( cd $SCRIPT_DIR && cd ../.. & pwd)"
SHELL_DIR=$BASE_DIR/shell/

echo "Publishing Shell Packages"

pushd ${SHELL_DIR}
yarn publish . --patch --no-git-tag-version
popd

pushd ${SHELL_DIR}/creators/app
yarn publish . --patch --no-git-tag-version
popd

pushd ${SHELL_DIR}/creators/pkg
yarn publish . --patch --no-git-tag-version
popd
