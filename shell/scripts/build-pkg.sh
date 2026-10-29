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

PKG_ARG=${1}
CREATE_TARBALL=${2}

# Set by build_pkg once the .shell link for the package being built is confirmed
# as ours, so the trap below can never remove a .shell this script did not create
SHELL_LINK=""

# Remove the .shell link however the script exits, so that an interrupted
# build does not leave one behind and break every subsequent build
function cleanup_shell_link() {
  if [ -L "${SHELL_LINK}" ]; then
    rm -f "${SHELL_LINK}"
  fi
}

trap cleanup_shell_link EXIT
trap 'cleanup_shell_link; trap - INT; kill -INT $$' INT
trap 'cleanup_shell_link; trap - TERM; kill -TERM $$' TERM

# A folder under pkg/ is a UI Package we can build when it has both a package.json
# and an entry point. This is what keeps libraries like rancher-components, which
# live under pkg/ but are built by `yarn build:lib`, out of a build-everything run
function is_pkg() {
  local DIR=${BASE_DIR}/pkg/${1}

  [ -f "${DIR}/package.json" ] && { [ -f "${DIR}/index.ts" ] || [ -f "${DIR}/index.js" ]; }
}

function build_pkg() {
  local PKG=${1}
  local PKG_VERSION=${VERSION}

  if [ -z "${PKG_VERSION}" ]; then
    PKG_VERSION=$(cd pkg/${PKG}; node -p -e "require('./package.json').version")
  fi

  local NAME=${PKG}-${PKG_VERSION}
  local PKG_DIST=${BASE_DIR}/dist-pkg/${NAME}

  echo "Building UI Package ${PKG}"
  echo "  Package name:    ${NAME}"
  echo "  Package version: ${PKG_VERSION}"
  echo "  Output formats:  ${FORMATS}"
  echo "  Output directory: ${PKG_DIST}"
  rm -rf ${PKG_DIST}
  mkdir -p ${PKG_DIST}

  pushd pkg/${PKG}

  if [ ! -f ./vite.config.mjs ] && [ -f ./vue.config.js ] && ! { [ "$(grep -cv '^[[:space:]]*$' ./vue.config.js)" = 1 ] && grep -qE "^module\.exports = require\('(\./\.shell|@rancher/shell)/pkg/vue\.config(\.js)?'\)\(__dirname\);?$" ./vue.config.js; }; then
    echo "vue.config.js is no longer used: packages are built with Vite. Move its configuration to vite.config.mjs, or run the extension creator with --migrate"
    popd
    return 1
  fi

  # Check that the .shell link exists and points to the correct place.
  # -L is tested as well as -e because -e is false for a dangling symlink,
  # which is what an interrupted build can leave behind
  if [ -L ".shell" ]; then
    local LINK=$(readlink .shell)
    if [ "${LINK}" != "${SHELL_DIR}" ]; then
      echo "Replacing stale .shell symlink (pointed to ${LINK})"
      rm -f .shell
      ln -s ${SHELL_DIR} .shell
    fi
  elif [ -e ".shell" ]; then
    echo ".shell exists but is not a symlink - please check and remove it"
    popd
    return 1
  else
    ln -s ${SHELL_DIR} .shell
  fi

  # Deliberately not local - cleanup_shell_link reads this from the traps
  SHELL_LINK="$(pwd)/.shell"

  if [ -n "$COMMIT" ]; then
    echo ${COMMIT} > ${PKG_DIST}/version
  fi

  local CONFIG=${SHELL_DIR%/}/pkg/vite.config.mjs
  if [ -f ./vite.config.mjs ]; then
    CONFIG=./vite.config.mjs
  fi

  PKG_NAME=${NAME} PKG_DIST=${PKG_DIST} PKG_FORMAT=${FORMATS} ${BASE_DIR}/node_modules/.bin/vite build --config ${CONFIG}
  local BUILD_EXIT_CODE=$?
  cp -f ./package.json ${PKG_DIST}/package.json
  node ${SCRIPT_DIR}/pkgfile.js ${PKG_DIST}/package.json
  rm -rf ${PKG_DIST}/*.bak
  rm -f .shell
  SHELL_LINK=""

  popd

  if [ ${BUILD_EXIT_CODE} -ne 0 ]; then
    return ${BUILD_EXIT_CODE}
  fi

  if [ -n "${CREATE_TARBALL}" ]; then
    echo $COMMIT $COMMIT_BRANCH > ${PKG_DIST}/version-commit.txt

    local TARBALL=${NAME}.tar.gz

    pushd ${PKG_DIST}

    rm -f ../$TARBALL

    echo "Compressing to ${TARBALL}..."

    tar -czf ../${TARBALL} .

    popd

  fi

  return 0
}

PKGS=()

if [ -z "${PKG_ARG}" ]; then
  # No package name given, so build every UI Package in this repo
  for DIR in ${BASE_DIR}/pkg/*/; do
    CANDIDATE=$(basename "${DIR}")

    if is_pkg "${CANDIDATE}"; then
      PKGS+=("${CANDIDATE}")
    fi
  done

  if [ ${#PKGS[@]} -eq 0 ]; then
    echo "No UI Packages to build - ${BASE_DIR}/pkg contains no folder with both a package.json and an index.ts or index.js"
    exit 1
  fi

  echo "No UI Package name given, building all ${#PKGS[@]} found in ${BASE_DIR}/pkg: ${PKGS[*]}"
  echo ""
else
  if ! is_pkg "${PKG_ARG}"; then
    echo "Can not build UI Package '${PKG_ARG}' - ${BASE_DIR}/pkg/${PKG_ARG} is missing, or has no package.json and index.ts or index.js"
    exit 1
  fi

  PKGS=("${PKG_ARG}")
fi

for PKG in "${PKGS[@]}"; do
  build_pkg "${PKG}"
  EXIT_CODE=$?

  if [ ${EXIT_CODE} -ne 0 ]; then
    echo "Failed to build UI Package '${PKG}'"
    exit ${EXIT_CODE}
  fi
done

exit ${EXIT_CODE}
