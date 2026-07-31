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

# Read branches-metadata.json and extract version from e2e.rancher-version
# Falls back to milestone.version, then to master, then to default
VERSION=$(jq -r ".branches[\"$TARGET_BRANCH\"].e2e[\"rancher-version\"] // .branches[\"$TARGET_BRANCH\"].milestone.version // .branches.master.e2e[\"rancher-version\"] // \"99.0.0\"" branches-metadata.json)

# Remove 'v' prefix if present
PARSED_VERSION="${VERSION#v}"

echo "$PARSED_VERSION"
