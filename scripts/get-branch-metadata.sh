#!/bin/bash
set -e

# Get the directory of the script to find the project root
DIR=$(cd $(dirname $0)/..; pwd)

# 1. discover the current github branch
if [ -n "$1" ]; then
  BRANCH="$1"
else
  BRANCH=$(git rev-parse --abbrev-ref HEAD)
fi

echo "Current branch: ${BRANCH}" >&2

# 2. find the relevant json object in branches-metadata.json and return it
METADATA_FILE="${DIR}/branches-metadata.json"

if [ ! -f "$METADATA_FILE" ]; then
  echo "Error: branches-metadata.json not found at ${METADATA_FILE}" >&2
  exit 1
fi

if ! command -v jq &> /dev/null; then
    echo "jq could not be found. Please install jq to run this script." >&2
    exit 1
fi

METADATA=$(jq -r --arg branch "$BRANCH" '.branches[$branch] // ""' "$METADATA_FILE" )

echo "Metadata for branch '${BRANCH}':"  >&2
echo "$METADATA" >&2

# Return it
echo "${METADATA}"