#!/bin/bash
set -e

DIR=$(cd $(dirname $0)/../..; pwd)

# clean
if [ "$1" == "-c" ]; then
  echo "Cleaning .."
  rm -f dashboard.tar.gz
  rm -f dashboard.tar
  rm -f node
  rm -rf ui
  rm -rf cert
  rm -rf node_modules
  exit 0
fi

mkdir -p cert
cp ${DIR}/shell/server/server.* ./cert

if [ ! -d "${DIR}/dist/" ]; then
  pushd ${DIR}
  yarn install
  yarn build
  popd
fi

if [ ! -d "node_modules" ]; then
  yarn install --no-lockfile
fi

rm -rf ui
mkdir -p ui
cp -R ${DIR}/dist/* ./ui

EXE=$(which node)

cp $EXE .

rm -rf dashboard.tar
tar --exclude *.tar -cvf dashboard.tar .
gzip dashboard.tar