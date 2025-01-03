#!/bin/bash

set -x

export PATH=$PATH:"${WORKSPACE}/bin"


PRIV_KEY="${WORKSPACE}/.ssh/corral_private_key"
if [ -f "${PRIV_KEY}" ]; then 
  chmod 700 "${PRIV_KEY}"
else
  echo "$(corral vars ci corral_private_key -o yaml)" > "${PRIV_KEY}"
fi

chmod 400 "${PRIV_KEY}"

NODE_EXTERNAL_IP="$(corral vars ci first_node_ip)"


REPORT_DIR="."

if [[ $# -gt 1 ]]; then
  REPORT_DIR="$2"
  mkdir -p "$2"
fi

scp -r -i ${PRIV_KEY} -o StrictHostKeyChecking=no \
  -o UserKnownHostsFile=/dev/null "root@${NODE_EXTERNAL_IP}:$1" "${REPORT_DIR}"
