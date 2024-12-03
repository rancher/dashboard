#!/usr/bin/env bash

set -eo pipefail

validate_tagged_extension_creator() {
  TAG=$1
  UPDATE="false"

  if [ -z "$2" ]; then
    UPDATE="true"
  fi

  DIR=$(mktemp -d)
  pushd $DIR > /dev/null

  echo "*** Verifying extension creator for tag ::: ${TAG} ***"
  echo "Using temporary directory ${DIR}"

  # TODO: change yarn create to use the new tag approach (jordon to tweak code upstream)
  npm init @rancher/extension@${TAG} test-pkg --app-name test-app | cat

  pushd test-pkg > /dev/null

  yarn install

  yarn build-pkg test-pkg | cat


#   if [ $UPDATE == "true" ]; then
#     echo "*** Testing full update path for extensions ***"
#     echo "Testing update from legacy-v1 to legacy-v2"

#     #TODO: test update paths when their are implemented
#     yarn create @rancher/extension --update "legacy-v2"

#     rm -rf node_modules
#     rm -rf yarn.lock

#     yarn install

#     yarn build-pkg test-pkg | cat

#     echo "Testing update from legacy-v2 to latest"

#     #TODO: test update paths when their are implemented
#     yarn create @rancher/extension --update "latest"

#     rm -rf node_modules
#     rm -rf yarn.lock

#     yarn install

#     yarn build-pkg test-pkg | cat
#   fi

  echo "Cleaning temporary dir"
  popd > /dev/null

  echo "Removing folder ${DIR}"
  rm -rf ${DIR}
}

# test creating an extension with latest shell releases + build
validate_tagged_extension_creator "legacy-v1"
validate_tagged_extension_creator "legacy-v2"
validate_tagged_extension_creator "latest"

# test update paths + build
# validate_tagged_extension_creator "legacy-v1" "true"