#!/usr/bin/env bash

set -e

echo "Checking plugin build"

SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
BASE_DIR="$( cd $SCRIPT_DIR && cd ../.. & pwd)"
SHELL_DIR=$BASE_DIR/shell/
SHELL_VERSION="99.99.99"
DEFAULT_YARN_REGISTRY="https://registry.npmjs.org"
VERDACCIO_YARN_REGISTRY="http://localhost:4873"

echo ${SCRIPT_DIR}

SKIP_SETUP="false"
SKIP_STANDALONE="false"

if [ "$1" == "-s" ]; then
  SKIP_SETUP="true"
fi

if [ $SKIP_SETUP == "false" ]; then
  set +e
  which verdaccio > /dev/null
  RET=$?
  set -e

  if [ $RET -ne 0 ]; then
    echo "Verdaccio not installed"

    npm install -g verdaccio
  fi

  set +e
  RUNNING=$(pgrep Verdaccio | wc -l | xargs)
  set -e

  if [ $RUNNING -eq 0 ]; then
    verdaccio > verdaccio.log &
    PID=$!

    echo "Verdaccio: $PID"

    sleep 10

    echo "Configuring Verdaccio user"

    # Remove existing admin if already there
    if [ -f ~/.config/verdaccio/htpasswd ]; then
      sed -i.bak -e '/^admin:/d' ~/.config/verdaccio/htpasswd
    fi

    curl -XPUT -H "Content-type: application/json" -d '{ "name": "admin", "password": "admin" }' 'http://localhost:4873/-/user/admin' > login.json
    TOKEN=$(jq -r .token login.json)
    rm login.json
    cat > ~/.npmrc << EOF
//127.0.0.1:4873/:_authToken="$TOKEN"
//localhost:4873/:_authToken="$TOKEN"
EOF
  else
    echo "Verdaccio is already running"
  fi
fi

if [ -d ~/.local/share/verdaccio/storage/@rancher ]; then 
  rm -rf ~/.local/share/verdaccio/storage/@rancher/*
else
  rm -rf ~/.config/verdaccio/storage/@rancher/*
fi

export YARN_REGISTRY=$VERDACCIO_YARN_REGISTRY
export NUXT_TELEMETRY_DISABLED=1

# Remove test package from previous run, if present
if [ $TEST_PERSIST_BUILD != "true" ]; then
  echo "Removing folder ${BASE_DIR}/pkg/test-pkg"
  rm -rf ${BASE_DIR}/pkg/test-pkg
fi

# We need to patch the version number of the shell, otherwise if we are running
# with the currently published version, things will fail as those versions
# are already published and Verdaccio will check, since it is a read-through cache
sed -i.bak -e "s/\"version\": \"[0-9]*.[0-9]*.[0-9]*\(-alpha\.[0-9]*\|-release[0-9]*.[0-9]*.[0-9]*\|-rc\.[0-9]*\)\{0,1\}\",/\"version\": \"${SHELL_VERSION}\",/g" ${SHELL_DIR}/package.json
rm ${SHELL_DIR}/package.json.bak

# Same as above for Rancher Components
# We might have bumped the version number but its not published yet, so this will fail
sed -i.bak -e "s/\"version\": \"[0-9]*.[0-9]*.[0-9]*\(-alpha\.[0-9]*\|-release[0-9]*.[0-9]*.[0-9]*\|-rc\.[0-9]*\)\{0,1\}\",/\"version\": \"${SHELL_VERSION}\",/g" ${BASE_DIR}/pkg/rancher-components/package.json

# Publish shell
echo "Publishing shell packages to local registry"
yarn install
${SHELL_DIR}/scripts/publish-shell.sh

# Publish rancher components
yarn build:lib
yarn publish:lib

# We pipe into cat for cleaner logging - we need to set pipefail
# to ensure the build fails in these cases
set -o pipefail

if [ "${SKIP_STANDALONE}" == "false" ]; then
  DIR=$(mktemp -d)
  pushd $DIR > /dev/null

  echo "Using temporary directory ${DIR}"

  echo "Verifying app creator package"

  yarn create @rancher/app test-app
  pushd test-app
  yarn install

  echo "Building skeleton app"

  FORCE_COLOR=true yarn build | cat

  # Package creator
  echo "Verifying package creator package"
  yarn create @rancher/pkg test-pkg

  echo "Building test package"
  FORCE_COLOR=true yarn build-pkg test-pkg | cat

  # Add test list component to the test package
  # Validates rancher-components imports
  mkdir pkg/test-pkg/list
  cp ${SHELL_DIR}/list/catalog.cattle.io.clusterrepo.vue pkg/test-pkg/list

  FORCE_COLOR=true yarn build-pkg test-pkg | cat

  echo "Cleaning temporary dir"
  popd > /dev/null

  if [ $TEST_PERSIST_BUILD != "true" ]; then
    echo "Removing folder ${DIR}"
    rm -rf ${DIR}
  fi
fi

pushd $BASE_DIR

# Now try a plugin within the dashboard codebase
echo "Validating in-tree package"

yarn install

if [ $TEST_PERSIST_BUILD != "true" ]; then
  echo "Removing folder ./pkg/test-pkg"
  rm -rf ./pkg/test-pkg
fi

yarn create @rancher/pkg test-pkg -t
cp ${SHELL_DIR}/list/catalog.cattle.io.clusterrepo.vue ./pkg/test-pkg/list
FORCE_COLOR=true yarn build-pkg test-pkg | cat
if [ $TEST_PERSIST_BUILD != "true" ]; then
  echo "Removing folder ./pkg/test-pkg"
  rm -rf ./pkg/test-pkg
fi

# function to clone repos and install dependencies (including the newly published shell version)
function clone_repo_test_extension_build() {
  REPO_NAME=$1
  PKG_NAME=$2

  echo -e "\nSetting up $REPO_NAME repository locally\n"

  # set registry to default (to install all of the other dependencies)
  yarn config set registry ${DEFAULT_YARN_REGISTRY}

  if [ $TEST_PERSIST_BUILD != "true" ]; then
    echo "Removing folder ${BASE_DIR}/$REPO_NAME"
    rm -rf ${BASE_DIR}/$REPO_NAME
  fi

  # cloning repo
  git clone https://github.com/rancher/$REPO_NAME.git
  pushd ${BASE_DIR}/$REPO_NAME

  echo -e "\nInstalling dependencies for $REPO_NAME\n"
  yarn install

  # set registry to local verdaccio (to install new shell)
  yarn config set registry ${VERDACCIO_YARN_REGISTRY}

  # update package.json to use a specific version of shell
  sed -i.bak -e "s/\"\@rancher\/shell\": \"[0-9]*.[0-9]*.[0-9]*\",/\"\@rancher\/shell\": \"${SHELL_VERSION}\",/g" package.json
  rm package.json.bak

  # we need to remove yarn.lock, otherwise it would install a version that we don't want
  rm yarn.lock

  echo -e "\nInstalling newly built shell version\n"

  # installing new version of shell
  yarn add @rancher/shell@${SHELL_VERSION}

  # test build-pkg
  FORCE_COLOR=true yarn build-pkg $PKG_NAME | cat

  # kubewarden has some unit tests and they should be quick to run... Let's check them as well
  if [ "${REPO_NAME}" == "kubewarden-ui" ]; then
    yarn test:ci
  fi

  # return back to the base path
  popd

  # delete folder
  if [ $TEST_PERSIST_BUILD != "true" ]; then
    echo "Removing folder ${BASE_DIR}/$REPO_NAME"
    rm -rf ${BASE_DIR}/$REPO_NAME
  fi
  yarn config set registry ${DEFAULT_YARN_REGISTRY}
}

# Here we just add the extension that we want to include as a check (all our official extensions should be included here)
# Don't forget to add the unit tests exception to clone_repo_test_extension_build function if a new extension has those
clone_repo_test_extension_build "kubewarden-ui" "kubewarden"
clone_repo_test_extension_build "elemental-ui" "elemental"

echo "All done"
