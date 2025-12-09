#!/bin/bash
set -e

# Get the current branch name
BRANCH_NAME=$(git rev-parse --abbrev-ref HEAD)

# Check if the branch is a release branch
if [[ $BRANCH_NAME =~ ^release-(.*)$ ]]; then
  RELEASE_VERSION="${BASH_REMATCH[1]}"
  NEW_TAG="v${RELEASE_VERSION}-head"

  echo "Updating versions for release: ${RELEASE_VERSION}"

  # Update package.json
  sed -i "s|rancher/rancher:head|rancher/rancher:${NEW_TAG}|g" package.json
  echo "Updated package.json"

  # Update scripts/e2e-docker-start
  sed -i "s|RANCHER_IMG_VERSION=head|RANCHER_IMG_VERSION=${NEW_TAG}|g" scripts/e2e-docker-start
  echo "Updated scripts/e2e-docker-start"

  # Update scripts/build-e2e
  sed -i "s|ui/latest2/index.html|ui/release-${RELEASE_VERSION}/index.html|g" scripts/build-e2e
  echo "Updated scripts/build-e2e"
else
  echo "Not a release branch, no changes made."
fi
