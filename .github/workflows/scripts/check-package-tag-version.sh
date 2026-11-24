#!/usr/bin/env bash

set -eo pipefail

echo "Checking package tag version matching"

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
BASE_DIR="$(cd -- "${SCRIPT_DIR}/../../.." &>/dev/null && pwd)"
SHELL_DIR=$BASE_DIR/shell
CREATORS_DIR=$BASE_DIR/creators/extension
METADATA_FILE=$BASE_DIR/branches-metadata.json

# shellcheck source=../../../shell/scripts/release-line.sh
source "${BASE_DIR}/shell/scripts/release-line.sh"

echo "TAG ${TAG}"

if [ -z "$TAG" ]; then
  echo "You need to set the TAG variable first!"
  exit 1
fi

# let's get the package name and version from the tag
PKG_NAME=$(sed 's/-pkg-v.*//' <<< "$TAG")
PKG_VERSION=$(sed 's/.*-pkg-v//' <<< "$TAG")

echo "PKG_NAME ${PKG_NAME}"
echo "PKG_VERSION ${PKG_VERSION}"

case $PKG_NAME in
  "shell")
    PKG_DIR=$SHELL_DIR
    ;;
  "creators")
    PKG_DIR=$CREATORS_DIR
    ;;
  *)
    echo "something went wrong with the tagging or versioning => TAG: ${TAG} , PKG_NAME: ${PKG_NAME}, PKG_VERSION: ${PKG_VERSION}"
    exit 1
    ;;
esac

# 1. the tag has to agree with the version the package will actually publish
PKG_JSON_VERSION=$(jq -r .version "${PKG_DIR}/package.json")

if [ "$PKG_JSON_VERSION" != "$PKG_VERSION" ]; then
  echo "Version mismatch for the ${PKG_NAME} package publish => ${PKG_NAME}: ${PKG_JSON_VERSION} vs tag: ${PKG_VERSION}. Please redo the tagging properly"
  exit 1
fi

echo "tag check: ${PKG_NAME} versions match"

# 2. the version has to name a release line
RELEASE_LINE=$(release_line_from_version "$PKG_VERSION")

if [ -z "$RELEASE_LINE" ]; then
  echo "Version ${PKG_VERSION} does not name a release line. Shell and creators are versioned 2NN.x.y from Rancher 2.17 onwards, where the major is the Rancher minor (2.17 -> 217)."
  exit 1
fi

RELEASE_BRANCH="release-${RELEASE_LINE}"

echo "RELEASE_LINE ${RELEASE_LINE}"

IS_PRE_RELEASE="false"

if [[ $PKG_VERSION == *"-"* ]]; then
  IS_PRE_RELEASE="true"
fi

# 3. the branch has to agree with the release line
#
# A tag does not know what branch it is on, so resolve the commit it points at and ask which
# branches contain it. Right after a branch cut that returns both master and the release
# branch, because they have not diverged yet — so the question is "does any containing branch
# match this line", not "what branch is this".
COMMIT=$(git rev-parse -q --verify "${TAG}^{commit}" || true)

if [ -z "$COMMIT" ]; then
  # Workflow test runs pass a tag built from package.json that was never pushed.
  COMMIT=$(git rev-parse HEAD)
  echo "Tag ${TAG} does not exist, resolving the branch from HEAD (${COMMIT}) instead"
fi

CONTAINING_BRANCHES=$(git branch -r --contains "${COMMIT}" --format='%(refname:short)' | sed 's|^origin/||')

echo "Branches containing ${COMMIT}:"
echo "${CONTAINING_BRANCHES}"

if grep -qx "${RELEASE_BRANCH}" <<< "${CONTAINING_BRANCHES}"; then
  echo "tag check: ${PKG_NAME} ${PKG_VERSION} is published from ${RELEASE_BRANCH}"
  exit 0
fi

if ! grep -qx "master" <<< "${CONTAINING_BRANCHES}"; then
  echo "${PKG_NAME} ${PKG_VERSION} belongs to ${RELEASE_LINE}, but its commit is on neither ${RELEASE_BRANCH} nor master. Tag the commit on ${RELEASE_BRANCH}."
  exit 1
fi

# On master. Master builds one line at a time and never goes GA, so a stable version from
# here would be a release of something that has not been cut yet.
MASTER_MILESTONE=$(jq -r '.branches.master.milestone.version' "${METADATA_FILE}")
MASTER_LINE=$(sed -E 's/^v?([0-9]+\.[0-9]+).*/\1/' <<< "${MASTER_MILESTONE}")

if [ "$MASTER_LINE" != "$RELEASE_LINE" ]; then
  echo "${PKG_NAME} ${PKG_VERSION} belongs to ${RELEASE_LINE}, but master is building ${MASTER_LINE} (milestone ${MASTER_MILESTONE}). Tag it on ${RELEASE_BRANCH}."
  exit 1
fi

if [ "$IS_PRE_RELEASE" != "true" ]; then
  echo "${PKG_NAME} ${PKG_VERSION} is a stable version and master only publishes pre-releases. Cut ${RELEASE_BRANCH} and tag it there, or tag a pre-release such as ${PKG_VERSION}-rc.1."
  exit 1
fi

if git show-ref --verify --quiet "refs/remotes/origin/${RELEASE_BRANCH}"; then
  echo "${PKG_NAME} ${PKG_VERSION} belongs to ${RELEASE_LINE} and ${RELEASE_BRANCH} already exists, but this commit is only on master. Tag it on ${RELEASE_BRANCH}."
  exit 1
fi

echo "tag check: ${PKG_NAME} ${PKG_VERSION} is a ${RELEASE_LINE} pre-release published from master"
exit 0
