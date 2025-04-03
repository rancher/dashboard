#!/bin/bash
set -eo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
BASE_DIR="$(cd "$SCRIPT_DIR/../../.." && pwd)"
BRANCH=gh-workflow-update-cloud-data

echo "Checking for updates to cloud data"
echo "Repository: ${REPO_NAME}"

if [ -z "${GH_TOKEN}" ]; then
  echo "GH_TOKEN environment variable not set"
  exit 1
fi

if [ -z "${REPO_NAME}" ]; then
  echo "REPO_NAME environment variable not set"
  exit 1
fi

SUMMARY=$(${BASE_DIR}/scripts/aws/update-data)

echo ${SUMMARY}

git diff-index --quiet HEAD

CHANGED=$?

if [ ${CHANGED} -eq 0 ]; then
  echo "No changes to cloud data"
  exit 0
fi

# The cloud data has been updated

# See if there is an open PR from the branch we use for cloud data changes
COUNT=$(gh pr list -R ${REPO_NAME} --head ${BRANCH} --json id --jq length)

if [ ${COUNT} -ne 0 ]; then
  echo "There is already an open pull request for cloud data updates"
  echo "A new PR will not be created until the existing PR is closed"
  exit 0
fi

echo "Cloud data has been updated and there is no existing open PR"

git checkout -b ${BRANCH}
git add --all
git commit "Update cloud data"
git push origin ${BRANCH}

echo "Creating PR with latest changes ..."

gh pr create -R ${REPO_NAME} --title "Update cloud data to latest" --body "Automated update of cloud data\n\n${SUMMARY}" --label "QA/None" -b master -H ${BRANCH}

echo "Completed"
