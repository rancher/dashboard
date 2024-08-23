#!/usr/bin/env bash
echo "Checking package tag version matching"

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
BASE_DIR="$(
  cd $SCRIPT_DIR && cd ../.. &
  pwd
)"
SHELL_DIR=$BASE_DIR/shell
CREATORS_DIR=$BASE_DIR/shell/creators/extension

echo "TAG ${TAG}"

# let's get the package name and version from the tag
# first step string split
IFS='-pkg-v'

read -r TEMP_STR <<<$TAG

echo "TEMP_STR ${TEMP_STR}"

# final step string split
IFS=' '

read -r PKG_NAME PKG_VERSION <<<$TEMP_STR

echo "PKG_NAME ${PKG_NAME}"
echo "PKG_VERSION ${PKG_VERSION}"

# version comparison checks
if [ "$PKG_NAME" == "shell" ]; then
  SHELL_VERSION=$(jq -r .version ${SHELL_DIR}/package.json)
  if [ "$SHELL_VERSION" == "$PKG_VERSION" ]; then
    echo "tag check: shell versions match"
    exit 0
  else 
    echo "Version mismatch for the shell package publish => shell: ${SHELL_VERSION} vs tag: ${PKG_VERSION}. Please redo the tagging properly"
    exit 1
  fi
elif [[ "$PKG_NAME" == "creators" ]]; then
  CREATORS_VERSION=$(jq -r .version ${CREATORS_DIR}/package.json)
  if [ "$CREATORS_VERSION" == "$PKG_VERSION" ]; then
    echo "tag check: creators versions match"
    exit 0
  else 
    echo "Version mismatch for the creators package publish => creators: ${CREATORS_VERSION} vs tag: ${PKG_VERSION}. Please redo the tagging properly"
    exit 1
  fi
else 
  echo "something went wrong with the tagging or versioning => TAG: ${TAG} , PKG_NAME: ${PKG_NAME}, PKG_VERSION: ${PKG_VERSION}"
  exit 1
fi