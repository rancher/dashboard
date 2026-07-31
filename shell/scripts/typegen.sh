#!/usr/bin/env bash

SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
BASE_DIR="$(git rev-parse --show-toplevel)"
SHELL_DIR=$BASE_DIR/shell

echo "Generating typescript definitions"

# `--ignoreConfig` is required from TypeScript 6 on: passing files on the command line
# while a tsconfig.json exists is an error (TS5112). Without it every `tsc` below fails
# and emits nothing, and because the output is discarded the generated `index.d.ts` ends
# up holding only its header - which strips the ambient `declare module '@shell/...'`
# definitions extensions rely on, and breaks their builds with TS7016.

rm -rf ${SHELL_DIR}/tmp
mkdir -p ${SHELL_DIR}/tmp

echo "Generating ..."

# utils
${BASE_DIR}/node_modules/.bin/tsc ${SHELL_DIR}/utils/*.js --ignoreConfig --declaration --allowJs --emitDeclarationOnly --outDir ${SHELL_DIR}/tmp/utils > /dev/null
${BASE_DIR}/node_modules/.bin/tsc ${SHELL_DIR}/utils/validators/*.js --ignoreConfig --declaration --allowJs --emitDeclarationOnly --outDir ${SHELL_DIR}/tmp/utils/validators > /dev/null
${BASE_DIR}/node_modules/.bin/tsc ${SHELL_DIR}/utils/crypto/*.js --ignoreConfig --declaration --allowJs --emitDeclarationOnly --outDir ${SHELL_DIR}/tmp/utils/crypto > /dev/null

# config
${BASE_DIR}/node_modules/.bin/tsc ${SHELL_DIR}/config/query-params.js --ignoreConfig --declaration --allowJs --emitDeclarationOnly --outDir ${SHELL_DIR}/tmp/config > /dev/null
${BASE_DIR}/node_modules/.bin/tsc ${SHELL_DIR}/config/table-headers.js --ignoreConfig --declaration --allowJs --emitDeclarationOnly --outDir ${SHELL_DIR}/tmp/config > /dev/null
${BASE_DIR}/node_modules/.bin/tsc ${SHELL_DIR}/config/types.js --ignoreConfig --declaration --allowJs --emitDeclarationOnly --outDir ${SHELL_DIR}/tmp/config > /dev/null
${BASE_DIR}/node_modules/.bin/tsc ${SHELL_DIR}/config/labels-annotations.js --ignoreConfig --declaration --allowJs --emitDeclarationOnly --outDir ${SHELL_DIR}/tmp/config > /dev/null
${BASE_DIR}/node_modules/.bin/tsc ${SHELL_DIR}/config/version.js --ignoreConfig --declaration --allowJs --emitDeclarationOnly --outDir ${SHELL_DIR}/tmp/config > /dev/null
${BASE_DIR}/node_modules/.bin/tsc ${SHELL_DIR}/config/product/*.js --ignoreConfig --declaration --allowJs --emitDeclarationOnly --outDir ${SHELL_DIR}/tmp/config/product > /dev/null

# # store
${BASE_DIR}/node_modules/.bin/tsc ${SHELL_DIR}/store/features.js --ignoreConfig --declaration --allowJs --emitDeclarationOnly --outDir ${SHELL_DIR}/tmp/store > /dev/null
${BASE_DIR}/node_modules/.bin/tsc ${SHELL_DIR}/store/plugins.js --ignoreConfig --declaration --allowJs --emitDeclarationOnly --outDir ${SHELL_DIR}/tmp/store > /dev/null
${BASE_DIR}/node_modules/.bin/tsc ${SHELL_DIR}/store/prefs.js --ignoreConfig --declaration --allowJs --emitDeclarationOnly --outDir ${SHELL_DIR}/tmp/store > /dev/null
${BASE_DIR}/node_modules/.bin/tsc ${SHELL_DIR}/store/store-types.js --ignoreConfig --declaration --allowJs --emitDeclarationOnly --outDir ${SHELL_DIR}/tmp/store > /dev/null

# # plugins
${BASE_DIR}/node_modules/.bin/tsc ${SHELL_DIR}/plugins/i18n.js --ignoreConfig --declaration --allowJs --emitDeclarationOnly --outDir ${SHELL_DIR}/tmp/ > /dev/null
${BASE_DIR}/node_modules/.bin/tsc ${SHELL_DIR}/plugins/dashboard-store/normalize.js --ignoreConfig --declaration --allowJs --emitDeclarationOnly --outDir ${SHELL_DIR}/tmp/plugins/dashboard-store/ > /dev/null
${BASE_DIR}/node_modules/.bin/tsc ${SHELL_DIR}/plugins/dashboard-store/resource-class.js --ignoreConfig --declaration --allowJs --emitDeclarationOnly --outDir ${SHELL_DIR}/tmp/plugins/dashboard-store/ > /dev/null
${BASE_DIR}/node_modules/.bin/tsc ${SHELL_DIR}/plugins/dashboard-store/classify.js --ignoreConfig --declaration --allowJs --emitDeclarationOnly --outDir ${SHELL_DIR}/tmp/plugins/dashboard-store/ > /dev/null
${BASE_DIR}/node_modules/.bin/tsc ${SHELL_DIR}/plugins/dashboard-store/actions.js --ignoreConfig --declaration --allowJs --emitDeclarationOnly --outDir ${SHELL_DIR}/tmp/plugins/dashboard-store/ > /dev/null
${BASE_DIR}/node_modules/.bin/tsc ${SHELL_DIR}/plugins/steve/steve-class.js --ignoreConfig --declaration --allowJs --emitDeclarationOnly --outDir ${SHELL_DIR}/tmp/plugins/steve/ > /dev/null
${BASE_DIR}/node_modules/.bin/tsc ${SHELL_DIR}/plugins/steve/hybrid-class.js --ignoreConfig --declaration --allowJs --emitDeclarationOnly --outDir ${SHELL_DIR}/tmp/plugins/steve/ > /dev/null

# # mixins
${BASE_DIR}/node_modules/.bin/tsc ${SHELL_DIR}/mixins/create-edit-view/index.js --ignoreConfig --declaration --allowJs --emitDeclarationOnly --outDir ${SHELL_DIR}/tmp/mixins/create-edit-view > /dev/null
${BASE_DIR}/node_modules/.bin/tsc ${SHELL_DIR}/mixins/resource-fetch.js --ignoreConfig --declaration --allowJs --emitDeclarationOnly --outDir ${SHELL_DIR}/tmp/mixins > /dev/null
${BASE_DIR}/node_modules/.bin/tsc ${SHELL_DIR}/mixins/resource-fetch-namespaced.js --ignoreConfig --declaration --allowJs --emitDeclarationOnly --outDir ${SHELL_DIR}/tmp/mixins > /dev/null
${BASE_DIR}/node_modules/.bin/tsc ${SHELL_DIR}/mixins/resource-fetch-api-pagination.js --ignoreConfig --declaration --allowJs --emitDeclarationOnly --outDir ${SHELL_DIR}/tmp/mixins > /dev/null

# # models
${BASE_DIR}/node_modules/.bin/tsc ${SHELL_DIR}/models/namespace.js --ignoreConfig --declaration --allowJs --emitDeclarationOnly --outDir ${SHELL_DIR}/tmp/models/ > /dev/null
${BASE_DIR}/node_modules/.bin/tsc ${SHELL_DIR}/models/networking.k8s.io.ingress.js --ignoreConfig --declaration --allowJs --emitDeclarationOnly --outDir ${SHELL_DIR}/tmp/models/ > /dev/null
${BASE_DIR}/node_modules/.bin/tsc ${SHELL_DIR}/models/catalog.cattle.io.clusterrepo.js --ignoreConfig --declaration --allowJs --emitDeclarationOnly --outDir ${SHELL_DIR}/tmp/models/ > /dev/null

#./node_modules/.bin/tsc ${SHELL_DIR}/plugins/dashboard-store/*.js --ignoreConfig --declaration --allowJs --emitDeclarationOnly --outDir ${SHELL_DIR}/tmp/plugins/dashboard-store

# Go through all of the folders and combine by wrapping with 'declare module'

echo "Contents of ${SHELL_DIR}/tmp after tsc commands:"
find ${SHELL_DIR}/tmp

echo "Combining type definitions ..."

DEST=${SHELL_DIR}/types/shell
mkdir -p ${DEST}

INDEX=${DEST}/index.d.ts
rm -rf ${INDEX}

echo "// Auto-generated type definitions for shell" > ${INDEX}
echo "// Do not modify this file as changes will get overwritten" >> ${INDEX}

echo "/// <reference types=\"@rancher/shell/types/vue-shim\" />" >> ${INDEX}
echo "/// <reference types=\"@rancher/shell/types/global-vue\" />" >> ${INDEX}

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

        local module=${basePkg}/${name}
        if [ "${name}" == "index" ]; then
          module=${basePkg}
        fi

        echo -e "\n// ${module}\n" >> ${INDEX}
        echo "declare module '${module}' {" >> ${INDEX}
        cat $entry >> ${INDEX}
        echo -e "}" >> ${INDEX}

        # Also generate a module declaration with .js extension for JS source files
        # TypeScript imports use .js extensions for JS files
        if [ "${name}" != "index" ]; then
          local moduleWithJs=${basePkg}/${name}.js
          echo -e "\n// ${moduleWithJs}\n" >> ${INDEX}
          echo "declare module '${moduleWithJs}' {" >> ${INDEX}
          cat $entry >> ${INDEX}
          echo -e "}" >> ${INDEX}
        fi
      fi
    fi
  done
}

processDir ${SHELL_DIR}/tmp @shell

rm -rf ${SHELL_DIR}/tmp
