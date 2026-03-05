#!/bin/bash
set -e

# 1. discover the current github branch
if [ -n "$1" ]; then
  BRANCH="$1"
else
  BRANCH=$(git rev-parse --abbrev-ref HEAD)
fi

echo "Current branch: ${BRANCH}" >&2

if ! command -v jq &> /dev/null; then
    echo "jq could not be found. Please install jq to run this script." >&2
    exit 1
fi

# 2. find the relevant json object in `master` branches-metadata.json
METADATA_JSON_URL=https://raw.githubusercontent.com/rancher/dashboard/master/branches-metadata.json
METADATA_JSON=$(curl -s -f -L $METADATA_JSON_URL) || {
  echo "Error: Failed to download $METADATA_JSON_URL" >&2
  exit 1
}

METADATA=$(echo "$METADATA_JSON" | jq -r --arg branch "$BRANCH" '.branches[$branch] // ""')

echo "Metadata for branch '${BRANCH}':"  >&2
echo "$METADATA" >&2

# 3. Return it
echo "${METADATA}"