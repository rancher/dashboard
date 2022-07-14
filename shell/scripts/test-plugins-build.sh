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
  which verdaccio > /dev/null

  if [ $? -ne 0 ]; then
    echo "Verdaccio not installed"

    npm install -g verdaccio
  fi

  RUNNING=$(ps -A | grep Verdaccio -c)

  if [ $RUNNING -eq 0 ]; then
    verdaccio > verdaccio.log &
    PID=$!

    echo "Verdaccio: $PID"

    sleep 10

    echo "Configuring Verdaccio usr"
    curl -XPUT -H "Content-type: application/json" -d '{ "name": "admin", "password": "admin" }' 'http://localhost:4873/-/user/admin'
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
  rm -rf *
  popd > /dev/null

  rm -f ${DIR}
fi

# Now try a plugin within the dashboard codebase
rm -rf ./pkg/test-pkg
yarn create @rancher/pkg test-pkg -t
cp ${SHELL_DIR}/list/catalog.cattle.io.clusterrepo.vue ./pkg/test-pkg/list
yarn build-pkg test-pkg
rm -rf ./pkg/test-pkg

echo "All done"
