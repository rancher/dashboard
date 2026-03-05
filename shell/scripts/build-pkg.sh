#!/usr/bin/env bash

SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
BASE_DIR="$( cd $SCRIPT_DIR && cd ../.. & pwd)"
SHELL_DIR=$BASE_DIR/shell/
EXIT_CODE=0

shift $((OPTIND-1))

# Use shell folder in node modules when we have @rancher/shell installed as a node module
# rather than the use-case of the mono-repo with the shell folder at the top-level
if [ ! -d ${SHELL_DIR} ]; then
  SHELL_DIR=$BASE_DIR/node_modules/@rancher/shell/
  SHELL_DIR=$(cd -P ${SHELL_DIR} && pwd)
fi

CREATE_TARBALL=${2}

if [ -z "$VERSION" ]; then
  VERSION=$(cd pkg/$1; node -p -e "require('./package.json').version")
fi

NAME=${1}-${VERSION}
PKG_DIST=${BASE_DIR}/dist-pkg/${NAME}

if [ -d "${BASE_DIR}/pkg/${1}" ]; then
  echo "Building UI Package $1 (ESM via Vite)"
  echo "  Package name:    ${NAME}"
  echo "  Package version: ${VERSION}"
  echo "  Output directory: ${PKG_DIST}"
  rm -rf ${PKG_DIST}
  mkdir -p ${PKG_DIST}

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

  if [ -n "$COMMIT" ]; then
    echo ${COMMIT} > ${PKG_DIST}/version
  fi

  # Build the extension as an ESM library using Vite.
  # Prefer the package's own vite.config if it exists, otherwise fall back
  # to the shell's pkg config (which uses process.cwd() to resolve the dir).
  if [ -f "vite.config.js" ]; then
    VITE_CONFIG="vite.config.js"
  else
    VITE_CONFIG=".shell/pkg/vite.config.js"
  fi
  ${BASE_DIR}/node_modules/.bin/vite build \
    --config ${VITE_CONFIG} \
    --outDir ${PKG_DIST}
  EXIT_CODE=$?

  cp -f ./package.json ${PKG_DIST}/package.json
  node ${SCRIPT_DIR}/pkgfile.js ${PKG_DIST}/package.json
  rm -rf ${PKG_DIST}/*.bak
  rm .shell

  popd
fi

if [ $EXIT_CODE -ne 0 ]; then
  exit $EXIT_CODE
fi


if [ -n "${CREATE_TARBALL}" ]; then
  echo $COMMIT $COMMIT_BRANCH > ${PKG_DIST}/version-commit.txt

  TARBALL=${NAME}.tar.gz

  pushd ${PKG_DIST}

  rm -f ../$TARBALL

  echo "Compressing to ${TARBALL}..."

  tar -czf ../${TARBALL} .

  popd

fi

exit $EXIT_CODE
