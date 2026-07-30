#!/usr/bin/env bash

set -e

echo "Checking plugin build"

SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
BASE_DIR="$( cd $SCRIPT_DIR && cd ../.. & pwd)"
SHELL_DIR=$BASE_DIR/shell/
SHELL_VERSION="99.99.99"
DEFAULT_NPM_REGISTRY="https://registry.npmjs.org/"
VERDACCIO_NPM_REGISTRY="http://localhost:4873"

# Yarn Berry has no global `yarn config set`; settings come from `.yarnrc.yml` files
# and `YARN_*` environment variables, and only the environment reaches the throwaway
# projects this script builds outside the repository. Everything published below goes
# to Verdaccio, which is served over plain HTTP and holds versions published seconds
# earlier, so whitelist the host and drop the release age cooldown for this run.
export YARN_UNSAFE_HTTP_WHITELIST="localhost,127.0.0.1"
export YARN_NPM_MINIMAL_AGE_GATE=0

# Corepack downloads the pinned Yarn on demand and asks for confirmation when doing
# so interactively, which would hang an unattended run
export COREPACK_ENABLE_DOWNLOAD_PROMPT=0

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

export NPM_REGISTRY=$VERDACCIO_NPM_REGISTRY
export NUXT_TELEMETRY_DISABLED=1

# Remove test package from previous run, if present
if [ "${TEST_PERSIST_BUILD}" != "true" ]; then
  echo "Removing folder ${BASE_DIR}/pkg/test-pkg"
  rm -rf ${BASE_DIR}/pkg/test-pkg
fi

# We need to patch the version number of the shell, otherwise if we are running
# with the currently published version, things will fail as those versions
# are already published and Verdaccio will check, since it is a read-through cache
update_version_in_package_json() {
  local package_json_path="$1"
  local version="$2"

  sed -i.bak -e "s/\"version\": \"[0-9]*.[0-9]*.[0-9]*\(-alpha\.[0-9]*\|-release[0-9]*.[0-9]*.[0-9]*\|-rc\.[0-9]*\)\{0,1\}\",/\"version\": \"${version}\",/g" "$package_json_path"
  rm "${package_json_path}.bak"
}

update_version_in_package_json "${SHELL_DIR}/package.json" "${SHELL_VERSION}"
update_version_in_package_json "${BASE_DIR}/pkg/rancher-components/package.json" "${SHELL_VERSION}"
update_version_in_package_json "${BASE_DIR}/creators/extension/package.json" "${SHELL_VERSION}"


createTestComponent() {
  # Add test list component to the test package
  # Validates rancher-components imports

  # Basic list instead
  cp ${SHELL_DIR}/list/namespace.vue pkg/test-pkg/list

  # More complex list
  cp ${SHELL_DIR}/list/catalog.cattle.io.clusterrepo.vue pkg/test-pkg/list
}

# Publish shell pkg (tag is needed as publish-shell is optimized to work with release-shell-pkg workflow)
echo "Publishing Shell package to local registry"
yarn install --immutable
export TAG="shell-pkg-v${SHELL_VERSION}"
${SHELL_DIR}/scripts/publish-shell.sh

# Publish creators pkg (tag is needed as publish-shell is optimized to work with release-shell-pkg workflow)
echo "Publishing Creators package to local registry"
export TAG="creators-pkg-v${SHELL_VERSION}"
${SHELL_DIR}/scripts/publish-shell.sh

# Publish rancher components
yarn build:lib

npm set registry ${VERDACCIO_NPM_REGISTRY}
export YARN_NPM_REGISTRY_SERVER=${VERDACCIO_NPM_REGISTRY}
yarn publish:lib

# We pipe into cat for cleaner logging - we need to set pipefail
# to ensure the build fails in these cases
set -o pipefail

if [ "${SKIP_STANDALONE}" == "false" ]; then
  DIR=$(mktemp -d)
  pushd $DIR > /dev/null

  echo "Using temporary directory ${DIR}"

  echo "Verifying extension creator"

  FORCE_COLOR=true yarn create @rancher/extension test-pkg --app-name test-app | cat

  pushd test-app > /dev/null

  # --no-immutable is required: the skeleton ships enableImmutableInstalls, and CI
  # sets it by default anyway, but Berry fails an immutable install when it would
  # have to create the lockfile, and the app has just been scaffolded without one
  yarn install --no-immutable
  # this is the "same" as doing a yarn dev (in a build sense)
  # it's to make sure the dev environment is running properly
  FORCE_COLOR=true yarn build | cat

  # Add test list component to the test package
  # Validates rancher-components imports
  mkdir -p pkg/test-pkg/list
  createTestComponent

  FORCE_COLOR=true yarn build-pkg test-pkg | cat

  echo "Cleaning temporary dir"
  popd > /dev/null

  if [ "${TEST_PERSIST_BUILD}" != "true" ]; then
    echo "Removing folder ${DIR}"
    rm -rf ${DIR}
  fi
fi

pushd $BASE_DIR

# Now try a plugin within the dashboard codebase
echo "Validating in-tree package"

yarn install --immutable

if [ "${TEST_PERSIST_BUILD}" != "true" ]; then
  echo "Removing folder ./pkg/test-pkg"
  rm -rf ./pkg/test-pkg
fi

yarn create @rancher/extension test-pkg -i
createTestComponent
FORCE_COLOR=true yarn build-pkg test-pkg | cat

if [ "${TEST_PERSIST_BUILD}" != "true" ]; then
  echo "Removing folder ./pkg/test-pkg"
  rm -rf ./pkg/test-pkg
fi

# The extension repositories cloned below are still on Yarn Classic and ship v1
# lockfiles. They are cloned inside this repository, so Corepack would otherwise walk
# up to the dashboard `packageManager` field and run Berry against them, which cannot
# install a v1 lockfile. Pin each clone to Classic, the Yarn those repositories build
# with themselves.
pin_yarn_classic() {
  node -e 'const fs = require("fs"); const pkg = JSON.parse(fs.readFileSync("package.json", "utf8")); pkg.packageManager = "yarn@1.22.22"; fs.writeFileSync("package.json", `${ JSON.stringify(pkg, null, 2) }\n`);'
}

# function to clone repos and install dependencies (including the newly published shell version)
function clone_repo_test_extension_build() {
  REPO_ORG=$1
  REPO_NAME=$2
  PKG_NAME=$3

  echo -e "\nSetting up $REPO_NAME repository locally\n"

  if [ "${TEST_PERSIST_BUILD}" != "true" ]; then
    echo "Removing folder ${BASE_DIR}/$REPO_NAME"
    rm -rf ${BASE_DIR}/$REPO_NAME
  fi

  # cloning repo
  git clone https://github.com/$REPO_ORG/$REPO_NAME.git
  pushd ${BASE_DIR}/$REPO_NAME

  pin_yarn_classic

  echo -e "\nInstalling dependencies for $REPO_NAME\n"
  # everything but the shell comes from the public registry
  yarn install --frozen-lockfile --registry ${DEFAULT_NPM_REGISTRY}

  # update package.json to use a specific version of shell
  sed -i.bak -e "s/\"\@rancher\/shell\": \"[0-9]*.[0-9]*.[0-9]*\",/\"\@rancher\/shell\": \"${SHELL_VERSION}\",/g" package.json
  rm package.json.bak

  echo -e "\nInstalling newly built shell version\n"

  # installing new version of shell from the local Verdaccio registry
  yarn add @rancher/shell@${SHELL_VERSION} -W --registry ${VERDACCIO_NPM_REGISTRY}

  # test build-pkg
  FORCE_COLOR=true yarn build-pkg $PKG_NAME | cat

  # # kubewarden has some unit tests and they should be quick to run... Let's check them as well
  # if [ "${REPO_NAME}" == "kubewarden-ui" ]; then
  #   yarn test:ci
  # fi

  # return back to the base path
  popd

  # delete folder
  echo "Removing folder ${BASE_DIR}/$REPO_NAME"
  rm -rf ${BASE_DIR}/$REPO_NAME
}

# Here we just add the extension that we want to include as a check (all our official extensions should be included here)
# Don't forget to add the unit tests exception to clone_repo_test_extension_build function if a new extension has those
# TODO: ISSUE #16858 - Reenable the tests as packages migrate to node version 24
clone_repo_test_extension_build "rancher" "kubewarden-ui" "kubewarden"
# clone_repo_test_extension_build "rancher" "elemental-ui" "elemental"
clone_repo_test_extension_build "neuvector" "manager-ext" "neuvector-ui-ext"
# clone_repo_test_extension_build "StackVista" "rancher-extension-stackstate" "observability"
# Uncomment once https://github.com/harvester/harvester/issues/10691 is resolved
#clone_repo_test_extension_build "harvester" "harvester-ui-extension" "harvester"
clone_repo_test_extension_build "rancher" "ali-ui" "ali"
clone_repo_test_extension_build "rancher" "virtual-clusters-ui" "virtual-clusters"
# clone_repo_test_extension_build "rancher" "rancher-ai-ui" "rancher-ai-ui"

echo "All done"
