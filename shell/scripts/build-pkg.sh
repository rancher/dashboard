#!/usr/bin/env bash

SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
BASE_DIR="$( cd $SCRIPT_DIR && cd ../.. & pwd)"
SHELL_DIR=$BASE_DIR/shell/
EXIT_CODE=0
FORMATS="umd-min"

while getopts "df:" opt; do
  case $opt in
    d)
      FORMATS="umd"
      ;;
    f)
      FORMATS=$OPTARG
      ;;      
  esac
done

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
  echo "Building UI Package $1"
  echo "  Package name:    ${NAME}"
  echo "  Package version: ${VERSION}"
  echo "  Output formats:  ${FORMATS}"
  echo "  Output directory: ${PKG_DIST}"
  rm -rf ${PKG_DIST}
  mkdir -p ${PKG_DIST}

  pushd pkg/${1}

  if [ ! -f ./vite.config.mjs ] && [ -f ./vue.config.js ] && ! { [ "$(grep -cv '^[[:space:]]*$' ./vue.config.js)" = 1 ] && grep -qE "^module\.exports = require\('(\./\.shell|@rancher/shell)/pkg/vue\.config(\.js)?'\)\(__dirname\);?$" ./vue.config.js; }; then
    echo "vue.config.js is no longer used: packages are built with Vite. Move its configuration to vite.config.mjs, or run the extension creator with --migrate"
    popd
    exit 1
  fi

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

  CONFIG=${SHELL_DIR%/}/pkg/vite.config.mjs
  if [ -f ./vite.config.mjs ]; then
    CONFIG=./vite.config.mjs
  fi

  PKG_NAME=${NAME} PKG_DIST=${PKG_DIST} PKG_FORMAT=${FORMATS} ${BASE_DIR}/node_modules/.bin/vite build --config ${CONFIG}
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
