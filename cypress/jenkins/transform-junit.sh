#!/bin/bash

set -x

pip3 install beautifulsoup4 requests lxml

pwd
ls -al .
python3 cypress/jenkins/junit_to_qase.py
