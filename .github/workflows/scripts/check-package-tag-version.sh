#!/usr/bin/env bash
echo "Checking package tag version matching"

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
BASE_DIR="$(
  cd $SCRIPT_DIR && cd ../.. &
  pwd
)"
SHELL_DIR=$BASE_DIR/shell
CREATORS_DIR=$BASE_DIR/creators/extension

echo "TAG ${TAG}"

# let's get the package name and version from the tag
PKG_NAME=$(sed 's/-pkg-v.*//' <<< "$TAG")
PKG_VERSION=$(sed 's/.*-pkg-v//'<<< "$TAG")

echo "PKG_NAME ${PKG_NAME}"
echo "PKG_VERSION ${PKG_VERSION}"

# version comparison checks
case $PKG_NAME in
  "shell")
    SHELL_VERSION=$(jq -r .version ${SHELL_DIR}/package.json)
    if [ "$SHELL_VERSION" == "$PKG_VERSION" ]; then
      echo "tag check: shell versions match"
      exit 0
    else 
      echo "Version mismatch for the shell package publish => shell: ${SHELL_VERSION} vs tag: ${PKG_VERSION}. Please redo the tagging properly"
      exit 1
    fi
    ;;
  "creators")
    CREATORS_VERSION=$(jq -r .version ${CREATORS_DIR}/package.json)
    if [ "$CREATORS_VERSION" == "$PKG_VERSION" ]; then
      echo "tag check: creators versions match"
      exit 0
    else 
      echo "Version mismatch for the creators package publish => creators: ${CREATORS_VERSION} vs tag: ${PKG_VERSION}. Please redo the tagging properly"
      exit 1
    fi
    ;;
  *)
    echo "something went wrong with the tagging or versioning => TAG: ${TAG} , PKG_NAME: ${PKG_NAME}, PKG_VERSION: ${PKG_VERSION}"
    exit 1
    ;;
esac