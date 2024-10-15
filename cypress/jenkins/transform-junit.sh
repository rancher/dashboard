#!/bin/bash

set -x

if cat /etc/os-release | grep -iq "Alpine Linux"; then
  apk update
  apk add --no-cache python3 py3-beautifulsoup4 py3-lxml py3-requests
else
  pip3 install beautifulsoup4 requests lxml
fi

pwd
ls -al .
python3 cypress/jenkins/junit_to_qase.py
