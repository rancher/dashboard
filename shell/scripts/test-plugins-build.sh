#!/usr/bin/env bash

set -e

echo "Checking plugin build"

SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
BASE_DIR="$( cd $SCRIPT_DIR && cd ../.. & pwd)"
SHELL_DIR=$BASE_DIR/shell/

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
  RUNNING=$(ps -A | grep Verdaccio -c)
  set -e

  if [ $RUNNING -eq 0 ]; then
    verdaccio > verdaccio.log &
    PID=$!

    echo "Verdaccio: $PID"

    sleep 10

    echo "Configuring Verdaccio user"
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

rm -rf ~/.local/share/verdaccio/storage/@rancher/*

export YARN_REGISTRY=http://localhost:4873

# Publish shell
echo "Publishing shell packages to local registry"
${SHELL_DIR}/scripts/publish-shell.sh

if [ "${SKIP_STANDALONE}" == "false" ]; then
  DIR=$(mktemp -d)
  pushd $DIR > /dev/null

  echo "Using temporary directory ${DIR}"

  echo "Verifying app creator package"

  yarn create @rancher/app test-app
  pushd test-app
  yarn install

  echo "Building skeleton app"
  yarn build

  # Package creator
  echo "Verifying package creator package"
  yarn create @rancher/pkg test-pkg

  echo "Building test package"
  yarn build-pkg test-pkg

  # Add test list component to the test package
  # Validates rancher-components imports
  mkdir pkg/test-pkg/list
  cp ${SHELL_DIR}/list/catalog.cattle.io.clusterrepo.vue pkg/test-pkg/list

  yarn build-pkg test-pkg

  echo "Cleaning temporary dir"
  popd > /dev/null

  rm -rf ${DIR}
fi

pushd $BASE_DIR
pwd
ls

# Now try a plugin within the dashboard codebase
echo "Validating in-tree package"

yarn install

rm -rf ./pkg/test-pkg
yarn create @rancher/pkg test-pkg -t
cp ${SHELL_DIR}/list/catalog.cattle.io.clusterrepo.vue ./pkg/test-pkg/list
yarn build-pkg test-pkg
rm -rf ./pkg/test-pkg

echo "All done"
