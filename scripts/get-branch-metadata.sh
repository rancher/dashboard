#!/usr/bin/env bash
set -e

# Default to fetching from remote
USE_LOCAL=false
BRANCH_ARG=""

# Parse arguments
for arg in "$@"
do
    case $arg in
        --local)
        USE_LOCAL=true
        shift # Remove --local from processing
        ;;
        *)
        BRANCH_ARG="$1"
        shift # Remove branch argument from processing
        ;;
    esac
done

# 1. discover the current github branch
if [ -n "$BRANCH_ARG" ]; then
  BRANCH="$BRANCH_ARG"
else
  BRANCH=$(git rev-parse --abbrev-ref HEAD)
fi

echo "Current branch: ${BRANCH}" >&2

if ! command -v jq &> /dev/null; then
    echo "jq could not be found. Please install jq to run this script." >&2
    exit 1
fi

# 2. find the relevant json object in branches-metadata.json
if [ "$USE_LOCAL" = "true" ]; then
  echo "Using local branches-metadata.json" >&2
  if [ ! -f "branches-metadata.json" ]; then
    echo "Error: branches-metadata.json not found in the current directory." >&2
    exit 1
  fi
  METADATA_JSON=$(cat branches-metadata.json)
else
  METADATA_JSON_URL=https://raw.githubusercontent.com/rancher/dashboard/master/branches-metadata.json
  METADATA_JSON=$(curl -s -f -L $METADATA_JSON_URL) || {
    echo "Error: Failed to download $METADATA_JSON_URL" >&2
    exit 1
  }
fi

METADATA=$(echo "$METADATA_JSON" | jq -r --arg branch "$BRANCH" '.branches[$branch] // ""')

if [ -z "$METADATA" ]; then
  echo "Error: No metadata found for branch '$BRANCH'." >&2
  exit 1
fi

echo "Metadata for branch '${BRANCH}':"  >&2
echo "$METADATA" >&2

# 3. Return it
echo "${METADATA}"