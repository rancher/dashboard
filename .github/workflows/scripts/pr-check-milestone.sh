#!/bin/bash
set -e

# Define the path to configuration file
CONFIG_FILE_PATH="branches-metadata.json"

# Check if config file exists
if [ ! -f "$CONFIG_FILE_PATH" ]; then
  echo "❌ Failed to read config file at $CONFIG_FILE_PATH"
  exit 1
fi

# Get PR details from the event payload
# GITHUB_EVENT_PATH is set by GitHub Actions
if [ -z "$GITHUB_EVENT_PATH" ]; then
  echo "❌ GITHUB_EVENT_PATH is not set"
  exit 1
fi

PR_TARGET_BRANCH=$(jq -r '.pull_request.base.ref' "$GITHUB_EVENT_PATH")
PR_MILESTONE=$(jq -r '.pull_request.milestone' "$GITHUB_EVENT_PATH")

# Check if milestone is present
if [ "$PR_MILESTONE" == "null" ]; then
  echo "❌ Pull Request must have a milestone assigned."
  exit 1
fi

PR_TARGET_MILESTONE=$(jq -r '.pull_request.milestone.title' "$GITHUB_EVENT_PATH")

echo "PR Target Branch: $PR_TARGET_BRANCH"
echo "PR Target Milestone: $PR_TARGET_MILESTONE"

# Look up expected milestone
EXPECTED_MILESTONE=$(jq -r --arg branch "$PR_TARGET_BRANCH" '.branches[$branch] | if . == null then "" else .milestone end' "$CONFIG_FILE_PATH")

if [ -z "$EXPECTED_MILESTONE" ]; then
  echo "❌ PR Target branch '$PR_TARGET_BRANCH' not found in $CONFIG_FILE_PATH."
  exit 1
fi

echo "Expected Milestone for branch '$PR_TARGET_BRANCH': $EXPECTED_MILESTONE"

if [ "$PR_TARGET_MILESTONE" != "$EXPECTED_MILESTONE" ]; then
  echo "❌ PR Target Milestone '$PR_TARGET_MILESTONE' does not match the required milestone '$EXPECTED_MILESTONE' for the PR Target Branch '$PR_TARGET_BRANCH'"
  exit 1
fi

echo "✅ PR Target Milestone '$PR_TARGET_MILESTONE' matches the expected branch milestone '$EXPECTED_MILESTONE'."