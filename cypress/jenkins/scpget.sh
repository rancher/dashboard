#!/bin/bash

set -x

export PATH=$PATH:"${WORKSPACE}/bin"

PRIV_KEY="${WORKSPACE}/.ssh/jenkins_ecdsa"
NODE_EXTERNAL_IP="$(corral vars ci first_node_ip)"

scp -r -i ${PRIV_KEY} -o StrictHostKeyChecking=no \
  -o UserKnownHostsFile=/dev/null "${AWS_SSH_USER}@${NODE_EXTERNAL_IP}:$1" .