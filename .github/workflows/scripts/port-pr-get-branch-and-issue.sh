#!/bin/bash
set -e

# Test with COMMENT_BODY="/backport v2.13.4" ./.github/workflows/scripts/port-pr-get-branch-and-issue.sh

# Determine envs (helpful for local testing)
GITHUB_REPOSITORY=${GITHUB_REPOSITORY:-rancher/dashboard}

# Determine type of command
TYPE=$(echo "${COMMENT_BODY}" | awk '{ print $1 }' | sed -e 's_/__')

# Determine the milestone
TARGET_MILESTONE=$(echo "${COMMENT_BODY}" | awk '{ print $2 }')

# Determine target branch for the port (optional - fallback on branch given milestone in branches-metadata
TARGET_BRANCH=$(echo "${COMMENT_BODY}" | awk '{ print $3 }')
if [ -z "$TARGET_BRANCH" ]; then
  METADATA_JSON_URL=https://raw.githubusercontent.com/rancher/dashboard/master/branches-metadata.json
  METADATA_JSON=$(curl -s -f -L $METADATA_JSON_URL) || {
    echo "Error: Failed to download $METADATA_JSON_URL" >&2
    exit 1
  }
  TARGET_BRANCH=$(echo "$METADATA_JSON" | jq -r --arg milestone "$TARGET_MILESTONE" '.branches | to_entries[] | select(.value.milestone.version == $milestone) | .key')
fi

# Determine the issue number (optional)
ISSUE_NUMBER=$(echo "${COMMENT_BODY}" | awk '{ print $4 }' | sed -e 's/#//')


# Confirm target branch exists
if gh api repos/${GITHUB_REPOSITORY}/branches --paginate | jq -e --arg TARGET_BRANCH "$TARGET_BRANCH" '.[] | select(.name == $TARGET_BRANCH)' > /dev/null; then
    TARGET_BRANCH_EXISTS=true
else
    TARGET_BRANCH_EXISTS=false
fi

# Exports for gh workflow world (having these at the end makes the file easier to test)
cat << EOF >> "$GITHUB_STEP_SUMMARY"
Type: ${TYPE}
Target branch: ${TARGET_BRANCH}
Issue number: ${ISSUE_NUMBER}
EOF

cat << EOF >> "$GITHUB_ENV"
type=${TYPE}
target_branch=${TARGET_BRANCH}
issue_number=${ISSUE_NUMBER}
target_branch_exists=${TARGET_BRANCH_EXISTS}
EOF

