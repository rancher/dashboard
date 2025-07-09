#!/bin/bash

set -x
set -e

pwd
ls -al
cd "dashboard"

kubectl version --client=true
kubectl get nodes

node -v

env

yarn config set ignore-engines true

yarn add -W mocha cypress-mochawesome-reporter cypress-multi-reporters cypress-commands \
  mochawesome-report-generator mochawesome-merge mocha-junit-reporter junit-report-merger

yarn add -W https://github.com/elaichenkov/cypress-delete-downloads-folder

export NO_COLOR=1
export PERCY_CLIENT_ERROR_LOGS=false
CYPRESS_grepTags="CYPRESSTAGS" npx percy exec -- cypress run --browser chrome --config-file cypress/jenkins/cypress.config.jenkins.ts

echo "CYPRESS EXIT CODE: $?"
