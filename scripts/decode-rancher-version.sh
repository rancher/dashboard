#!/bin/bash
set -e

# Extract Rancher version from branches-metadata.json based on target branch
#
# Usage: bash scripts/decode-rancher-version.sh <target-branch>
# Example: bash scripts/decode-rancher-version.sh master
#          bash scripts/decode-rancher-version.sh release-2.15

TARGET_BRANCH="$1"

if [ -z "$TARGET_BRANCH" ]; then
  echo "ERROR: Target branch must be provided as argument" >&2
  echo "Usage: bash scripts/decode-rancher-version.sh <target-branch>" >&2
  exit 1
fi

# Read branches-metadata.json and extract version
# Format: v2.16.0 or v2.15.0-head, etc.
VERSION=$(jq -r ".branches[\"$TARGET_BRANCH\"].milestone.version // .branches.master.milestone.version // \"v99.0.0\"" branches-metadata.json)

# Parse version: remove 'v' prefix
# v2.16.0 -> 2.16.0
# v2.15.0-head -> 2.15.0-head (keep pre-release)
PARSED_VERSION="${VERSION#v}"

echo "$PARSED_VERSION"
