#!/usr/bin/env bash

SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
BASE_DIR="$( cd $SCRIPT_DIR && cd ../.. & pwd)"
SHELL_DIR=$BASE_DIR/shell

echo "Generating typescript definitions"

rm -rf ${SHELL_DIR}/tmp
mkdir -p ${SHELL_DIR}/tmp

echo "Generating ..."

# utils
${BASE_DIR}/node_modules/.bin/tsc shell/utils/*.js --declaration --allowJs --emitDeclarationOnly --outDir ${SHELL_DIR}/tmp/utils > /dev/null

# config

${BASE_DIR}/node_modules/.bin/tsc shell/config/query-params.js --declaration --allowJs --emitDeclarationOnly --outDir ${SHELL_DIR}/tmp/config > /dev/null

#./node_modules/.bin/tsc shell/plugins/dashboard-store/*.js --declaration --allowJs --emitDeclarationOnly --outDir ${SHELL_DIR}/tmp/plugins/dashboard-store > /dev/null

# Go through all of the folders and combine by wrapping with 'declare module'

echo "Combining type definitions ..."

DEST=${SHELL_DIR}/types/shell
mkdir -p ${DEST}

INDEX=${DEST}/index.d.ts
rm -rf ${INDEX}

echo "// Auto-generated type definitions for shell" > ${INDEX}
echo "// Do not modify this file as changes will get overwritten" >> ${INDEX}

# Copy in the vue shim type definitions
if [ -f "$BASE_DIR/vue-shim.d.ts" ]; then
  cat "$BASE_DIR/vue-shim.d.ts" >> ${INDEX}
fi

function processDir() {
  local dir=$1
  local basePkg=$2

  for entry in $1/*
  do
    local filename=$(basename $entry)

    if [ -d $entry ]; then
      processDir $entry $basePkg/$filename
    else
      if [[ $filename == *.d.ts ]]; then
        # We use convoluted mechanism here to ensure this works on mac with bash 3.x
        local name=$(echo $filename | rev | cut -c6- | rev)

        echo -e "\n// ${basePkg}/${name}\n" >> ${INDEX}
        echo "declare module '${basePkg}/${name}' {" >> ${INDEX}
        cat $entry >> ${INDEX}
        echo -e "}" >> ${INDEX}
      fi
    fi
  done
}

processDir ${SHELL_DIR}/tmp @shell

rm -rf ${SHELL_DIR}/tmp
