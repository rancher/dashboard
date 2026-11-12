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

  SHELL_LINK="$(pwd)/.shell"

  # Check that the .shell link exists and points to the correct place.
  # -L is tested as well as -e because -e is false for a dangling symlink,
  # which is what an interrupted build can leave behind
  if [ -L ".shell" ]; then
    LINK=$(readlink .shell)
    if [ "${LINK}" != "${SHELL_DIR}" ]; then
      echo "Replacing stale .shell symlink (pointed to ${LINK})"
      rm -f .shell
      ln -s ${SHELL_DIR} .shell
    fi
  elif [ -e ".shell" ]; then
    echo ".shell exists but is not a symlink - please check and remove it"
    popd
    exit 1
  else
    ln -s ${SHELL_DIR} .shell
  fi

  # Remove the .shell link however the script exits, so that an interrupted
  # build does not leave one behind and break every subsequent build
  cleanupShellLink() {
    if [ -L "${SHELL_LINK}" ]; then
      rm -f "${SHELL_LINK}"
    fi
  }

  trap cleanupShellLink EXIT
  trap 'cleanupShellLink; trap - INT; kill -INT $$' INT
  trap 'cleanupShellLink; trap - TERM; kill -TERM $$' TERM

  FILE=index.js
  if [ -f ./index.ts ]; then
    FILE=index.ts
  fi

  if [ -n "$COMMIT" ]; then
    echo ${COMMIT} > ${PKG_DIST}/version
  fi

  ${BASE_DIR}/node_modules/.bin/vue-cli-service build --name ${NAME} --target lib ${FILE} --dest ${PKG_DIST} --formats ${FORMATS} --filename ${NAME}
  EXIT_CODE=$?
  cp -f ./package.json ${PKG_DIST}/package.json
  node ${SCRIPT_DIR}/pkgfile.js ${PKG_DIST}/package.json
  rm -rf ${PKG_DIST}/*.bak
  rm -f .shell

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
