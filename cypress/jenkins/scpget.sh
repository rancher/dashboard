#!/bin/bash

set -x

export PATH=$PATH:"${WORKSPACE}/bin"

PRIV_KEY="${WORKSPACE}/.ssh/jenkins_ecdsa"
NODE_EXTERNAL_IP="$(corral vars ci first_node_ip)"


REPORT_DIR="."

if [[ $# -gt 1 ]]; then
  REPORT_DIR="$2"
  mkdir -p "$2"
fi

scp -r -i ${PRIV_KEY} -o StrictHostKeyChecking=no \
  -o UserKnownHostsFile=/dev/null "root@${NODE_EXTERNAL_IP}:$1" "${REPORT_DIR}"
