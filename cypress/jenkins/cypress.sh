#!/bin/bash

set -x
set -e

pwd
ls -al
cd "dashboard"

node -v
yarn add --dev -W mocha mochawesome mochawesome-merge \
  mochawesome-report-generator cypress-multi-reporters \
  mocha-junit-reporter 

NO_COLOR=1 CYPRESS_grepTags="CYPRESSTAGS" cypress run --browser chrome \
  --reporter cypress-multi-reporters \
  --reporter-options \
    configFile=cypress/jenkins/reporter-options.json

echo "CYPRESS EXIT CODE: $?"
