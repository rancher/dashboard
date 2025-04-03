#!/bin/bash
set -e

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
BASE_DIR="$(cd "$SCRIPT_DIR/../../.." && pwd)"
BRANCH=gha-update-cloud-data
TARGET_BRANCH=master

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

echo "Checking if cloud data is up to date ..."

BODY_FILE=$(mktemp)

# This script returns a non-zero error code if there are changes
set +e
${BASE_DIR}/scripts/aws/update-data > ${BODY_FILE}
echo "\n" >> ${BODY_FILE}
${BASE_DIR}/scripts/azure/update-data >> ${BODY_FILE}

cat ${BODY_FILE}

# Check to see if either script caused any files to be updated
git diff-index --quiet HEAD

CHANGED=$?

if [ ${CHANGED} -eq 0 ]; then
  echo "No changes to cloud data"
  exit 0
fi

set -e

# The cloud data has been updated

# See if there is an open PR from the branch we use for cloud data changes
COUNT=$(gh pr list -R ${REPO_NAME} --head ${BRANCH} --json id --jq length)

if [ ${COUNT} -ne 0 ]; then
  echo "There is already an open pull request for cloud data updates"
  echo "A new PR will not be created until the existing PR is closed"
  exit 0
fi

echo "Cloud data has been updated and there is no existing open PR"

git config --global user.email "rancherdashboardbot@suse.com"
git config --global user.name "Rancher Dashboard Cloud Data Bot"

# Add the cloud data file(s) that were updated
git add .

DATE_STAMP=$(date '+%Y-%m-%d')

git commit -m "Update cloud data (${DATE_STAMP})"

set +e
git ls-remote --exit-code --heads origin $BRANCH >/dev/null 2>&1
EXIT_CODE=$?

if [[ $EXIT_CODE == '0' ]]; then
  echo "Git branch '$BRANCH' exists in the remote repository - removing"

  # Delete the branch
  git push origin --delete ${BRANCH}
fi

set -e

git checkout -b ${BRANCH}
git push origin ${BRANCH}

echo "Creating PR with latest changes ..."

gh pr create -R ${REPO_NAME} \
  --title "Update cloud data to latest (${DATE_STAMP})" \
  --body-file ${BODY_FILE} \
  --label "area/dependencies" \
  --base "${TARGET_BRANCH}" \
  --head "${BRANCH}"

echo "Completed"
