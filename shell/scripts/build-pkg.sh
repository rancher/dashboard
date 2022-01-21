#!/usr/bin/env bash

SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
BASE_DIR="$( cd $SCRIPT_DIR && cd ../.. & pwd)"
SHELL_DIR=$BASE_DIR/shell/

# Use shell folder in node modules when we have @ranch/shell installed as a node module
# rather than the use-case of the mono-repo with the shell folder at the top-level
if [ ! -d ${SHELL_DIR} ]; then
  SHELL_DIR=$BASE_DIR/node_modules/@ranch/shell/
  SHELL_DIR=$(cd -P ${SHELL_DIR} && pwd)
fi

PKG_DIST=${BASE_DIR}/dist-pkg/${1}

if [ -d "${BASE_DIR}/pkg/${1}" ]; then
  echo "Building UI Package $1"
  rm -rf ${BASE_DIR}/dist-pkg/${1}
  mkdir -p ${BASE_DIR}/dist-pkg/${1}

  pushd pkg/${1}

  # Check that the .shell link exists and points to the correct place
  if [ -e ".shell" ]; then
    LINK=$(readlink .shell)
    if [ "${LINK}" != "${SHELL_DIR}" ]; then
      echo ".shell symlink exists but does not point to expected location - please check and fix"
      popd
      exit -1
    fi
  else
    ln -s ${SHELL_DIR} .shell
  fi

  FILE=index.js

  if [ -f ./index.ts ]; then
    FILE=index.ts
  fi

  ${BASE_DIR}/node_modules/.bin/vue-cli-service build --name ${1} --target lib ${FILE} --dest ${PKG_DIST} --formats umd-min
  cp ${SCRIPT_DIR}/package.json ${PKG_DIST}/package.json
  sed -i.bak -e "s/@@NAME/${1}/g" ${PKG_DIST}/package.json
  rm -rf ${PKG_DIST}/*.bak
  rm .shell

  popd  
fi
