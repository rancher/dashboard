#!/usr/bin/env bash

set -e

CYAN="\033[96m"
YELLOW="\033[93m"
RESET="\033[0m"
BOLD="\033[1m"
NORMAL="\033[22m"

echo -e "${BOLD}${CYAN}Extensions framework build tests${RESET}"

SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
BASE_DIR="$( cd $SCRIPT_DIR && cd ../.. & pwd)"
SHELL_DIR=$BASE_DIR/shell/

# ---- Options ----------------------------------------------------------------------------------------------------

KEEP_FOLDER=false
KEEP_PKG=false
SKIP_IN_TREE=false
SKIP_SETUP=false
SKIP_STANDALONE=false

REG_USER=admin
REG_PWD=admin

usage() {
  echo "Usage: $0 [<options>] [plugins]"
  echo " options:"
  echo "  -k           Keep the folder for the test application after run"
  echo "  -e           Keep the test extension after run (in-tree tests)"
  echo "  -i           Skip in-tree tests"
  echo "  -s           Skip standalone tests"
  echo "  -x           Skip test setup"
  echo "  -u <name>    Verdaccio user name for publishing (default: admin)"
  echo "  -p <name>    Verdaccio password for publishing"
  exit 1
}

while getopts "hkeisr:p:" opt; do
  case $opt in
    h)
      usage
      ;;
    k)
      KEEP_FOLDER=true
      echo "Folder for test appliaction will not be deleted after test run"
      ;;
    e)
      KEEP_PKG=true
      echo "Folder for test extension will not be deleted after test run"
      ;;
    i)
      SKIP_IN_TREE=true
      echo "In-tree tests will not be run"
      ;;
    s)
      SKIP_STANDALONE=true
      echo "Standalone tests will not be run"
      ;;
    x)
      SKIP_SETUP=true
      echo "Setup will be skipped"
      ;;
    r)
      REG_USER=${OPTARG}
      echo "Registry user: ${REG_USER}"
      ;;
    p)
      REG_PWD=${OPTARG}
      ;;
    *)
      usage
      ;;
  esac
done

shift $((OPTIND-1))

# ---- Cleanup ----------------------------------------------------------------------------------------------------
# Cleanup called on exit and if process if stopped via CTRL+C
cleanup() {
  echo ""

  set +e

  rm -f ~/.npmrc.bak

  if [ -n "${TEMP_APP_FOLDER}" ]; then
    if [ ${KEEP_FOLDER} == false ]; then
      echo "Removing test application folder"
      rm -rf ${TEMP_APP_FOLDER}
    else
      echo -e "${BOLD}${CYAN}Test application was not deleted - folder:"
      echo -e "${TEMP_APP_FOLDER}${RESET}"
    fi
  fi

  if [ ${KEEP_PKG} == false ]; then
    rm -rf ./pkg/test-pkg
  fi

  # Restore shell version
  if [ -n "${SHELL_VERSION}" ]; then
    sed -i.bak -e "s/\"version\": \"7.7.7\",/\"version\": \"${SHELL_VERSION}\",/g" ${SHELL_DIR}/package.json
    rm -f ${SHELL_DIR}/package.json.bak
  fi

  # Restore rancher components version
  if [ -n "${RANCHER_COMPONENTS_VERSION}" ]; then
    sed -i.bak -e "s/\"version\": \"7.7.7\",/\"version\": \"${RANCHER_COMPONENTS_VERSION}\",/g" ${BASE_DIR}/pkg/rancher-components/package.json
    rm -f ${BASE_DIR}/pkg/rancher-components/package.json.bak
  fi

  # Remove extra script target that may have been added to the top level package file
  ${SCRIPT_DIR}/extension-test/test-plugins-reset

  # Stop Verdaccio if we started it
  if [ -n "${PID}" ]; then
    echo "Stopping Verdaccio ..."
    kill ${PID}
  fi
}

# Run cleanup function on exit
trap cleanup EXIT

# ---- Test Setup ----------------------------------------------------------------------------------------------------
if [ $SKIP_SETUP == false ]; then
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
    echo -e "${CYAN}Starting Verdaccio ...${RESET}"
    verdaccio > verdaccio.log &
    PID=$!

    echo "Verdaccio: $PID"

    sleep 10

    echo "Configuring Verdaccio user"

    # Remove existing admin if already there
    if [ -f ~/.config/verdaccio/htpasswd ]; then
      sed -i.bak -e '/^admin:/d' ~/.config/verdaccio/htpasswd
    fi

    # Login to the registry - can't do this non-interactively via CLI, so use curl to get a token
    # and then manually add this token to ~/.npmrc
    JSON=$(curl -s -XPUT -H "Content-type: application/json" -d '{ "name": "'${REG_USER}'", "password": "'${REG_PWD}'" }' 'http://localhost:4873/-/user/admin')

    set +e
    TOKEN=$(echo $JSON | node --no-deprecation ${SCRIPT_DIR}/extension-test/test-plugins-parse-login)
    RETVAL=$?
    set -e

    if [ $RETVAL -ne 0 ]; then
      exit $RETVAL
    fi

    # Remove old creds from .npmrc
    touch ~/.npmrc
    sed -i.bak -e '/127\.0\.0\.1:4873/d' ~/.npmrc
    sed -i.bak -e '/localhost:4873/d' ~/.npmrc

    # Store new token for the registry, so that we are authenticated
    cat >> ~/.npmrc << EOF
//127.0.0.1:4873/:_authToken="$TOKEN"
//localhost:4873/:_authToken="$TOKEN"
EOF
  else
    echo "Verdaccio is already running"
    echo "You should ensure a user is set up and logged in for publishing" 
  fi
fi

# Clear out old Rancher packages fro Verdaccio
if [ -d ~/.local/share/verdaccio/storage/@rancher ]; then 
  rm -rf ~/.local/share/verdaccio/storage/@rancher/*
else
  rm -rf ~/.config/verdaccio/storage/@rancher/*
fi

export YARN_REGISTRY=http://localhost:4873
export NUXT_TELEMETRY_DISABLED=1

# ---- Check that we are logged in to Verdaccio -------------------------------------------------------------------------------------------
WHOAMI=$(npm whoami --registry=${YARN_REGISTRY})

if [ "$WHOAMI" != "${REG_USER}" ]; then
  echo -e "${YELLOW}${BOLD}Not logged in to Verdaccio - can not proceed"
  echo -e "User: ${WHOAMI}${RESET}"
  exit 1
fi

# ---- Test preparation -------------------------------------------------------------------------------------------------------------------

# Remove test package from previous run, if present
rm -rf ${BASE_DIR}/pkg/test-pkg

# We need to patch the version number of the shell, otherwise if we are running
# with the currently published version, things will fail as those versions
# are already published and Verdaccio will check, since it is a read-through cache
SHELL_VERSION=$(node -p -e "require('${SHELL_DIR}/package.json').version")
sed -i.bak -e "s/\"version\": \"[0-9]*.[0-9]*.[0-9]*\",/\"version\": \"7.7.7\",/g" ${SHELL_DIR}/package.json
rm ${SHELL_DIR}/package.json.bak

# Same as above for Rancher Components
# We might have bumped the version number but its not published yet, so this will fail
RANCHER_COMPONENTS_VERSION=$(node -p -e "require('${BASE_DIR}/pkg/rancher-components/package.json').version")
sed -i.bak -e "s/\"version\": \"[0-9]*.[0-9]*.[0-9]*\",/\"version\": \"7.7.7\",/g" ${BASE_DIR}/pkg/rancher-components/package.json
rm ${BASE_DIR}/pkg/rancher-components/package.json.bak

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

if [ ${SKIP_STANDALONE} == false ]; then
  DIR=$(mktemp -d)
  TEMP_APP_FOLDER=${DIR}
  pushd $DIR > /dev/null

  echo -e "${BOLD}${CYAN}Validating standalone extension test case${RESET}"

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

  popd > /dev/null
fi

pushd $BASE_DIR
pwd
ls

if [ ${SKIP_IN_TREE} == false ]; then
  # Now try a plugin within the dashboard codebase
  echo -e "${BOLD}${CYAN}Validating in-tree extension test case${RESET}"

  yarn install

  rm -rf ./pkg/test-pkg

  echo -e "${CYAN}Creating test-pkg extension using the package creator${RESET}"
  yarn create @rancher/pkg test-pkg -t
  cp ${SHELL_DIR}/list/catalog.cattle.io.clusterrepo.vue ./pkg/test-pkg/list

  echo -e "${CYAN}Building test-pkg extension${RESET}"
  FORCE_COLOR=true yarn build-pkg test-pkg | cat
fi

echo "All done"
