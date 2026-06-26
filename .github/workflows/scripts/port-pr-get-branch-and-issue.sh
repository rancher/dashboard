#!/bin/bash
set -e

: <<'END_COMMENT'

Supported Commands
1. `/backport v2.12.4`
  - Determine branch via branches-metadata.json
  - no issue number
2. `/backport v2.12.4 release-abc`
  - Use the branch provided
  - no issue number
3. `/backport v2.12.4 release-abc #1234`
  - Use the branch provided
  - Use the issue number

Examples

export GITHUB_STEP_SUMMARY=$(mktemp) && export GITHUB_ENV=$(mktemp) && export GITHUB_REPOSITORY=rancher/dashboard
COMMENT_BODY="/backport v2.13.4" ./.github/workflows/scripts/port-pr-get-branch-and-issue.sh && cat $GITHUB_STEP_SUMMARY

export GITHUB_STEP_SUMMARY=$(mktemp) && export GITHUB_ENV=$(mktemp) && export GITHUB_REPOSITORY=rancher/dashboard
COMMENT_BODY="/backport v2.13.4 release-abc" ./.github/workflows/scripts/port-pr-get-branch-and-issue.sh && cat $GITHUB_STEP_SUMMARY

export GITHUB_STEP_SUMMARY=$(mktemp) && export GITHUB_ENV=$(mktemp) && export GITHUB_REPOSITORY=rancher/dashboard
COMMENT_BODY="/backport v2.13.4 release-abc #1234" ./.github/workflows/scripts/port-pr-get-branch-and-issue.sh && cat $GITHUB_STEP_SUMMARY

END_COMMENT

# Determine envs (helpful for local testing)
GITHUB_REPOSITORY=${GITHUB_REPOSITORY:-rancher/dashboard}

# Determine type of command
TYPE=$(echo "${COMMENT_BODY}" | awk '{ print $1 }' | sed -e 's_/__')

# Determine the milestone
TARGET_MILESTONE=$(echo "${COMMENT_BODY}" | awk '{ print $2 }')

# Determine target branch for the port
TARGET_BRANCH=$(echo "${COMMENT_BODY}" | awk '{ print $3 }')
if [ -n "$TARGET_BRANCH" ]; then # Use the supplied target branch
  # Determine the issue number (optional)
  ISSUE_NUMBER=$(echo "${COMMENT_BODY}" | awk '{ print $4 }' | sed -e 's/#//')
else # Fallback on branch given milestone in branches-metadata
  METADATA_JSON_URL=https://raw.githubusercontent.com/rancher/dashboard/master/branches-metadata.json
  METADATA_JSON=$(curl -s -f -L $METADATA_JSON_URL) || {
    echo "Error: Failed to download $METADATA_JSON_URL" >&2
    exit 1
  }
  TARGET_BRANCH=$(echo "$METADATA_JSON" | jq -r --arg milestone "$TARGET_MILESTONE" '.branches | to_entries[] | select(.value.milestone.version == $milestone) | .key')
fi

# Confirm target branch exists
if gh api repos/${GITHUB_REPOSITORY}/branches --paginate | jq -e --arg TARGET_BRANCH "$TARGET_BRANCH" '.[] | select(.name == $TARGET_BRANCH)' > /dev/null; then
    TARGET_BRANCH_EXISTS=true
else
    TARGET_BRANCH_EXISTS=false
fi

# Exports for gh workflow world (having these at the end makes the file easier to test)
cat << EOF >> "$GITHUB_STEP_SUMMARY"
Type: ${TYPE}
Target milestone: ${TARGET_MILESTONE}
Target branch: ${TARGET_BRANCH}
Target branch exists: ${TARGET_BRANCH_EXISTS}
Issue number: ${ISSUE_NUMBER}
EOF

cat << EOF >> "$GITHUB_ENV"
type=${TYPE}
target_branch=${TARGET_BRANCH}
issue_number=${ISSUE_NUMBER}
target_branch_exists=${TARGET_BRANCH_EXISTS}
EOF
