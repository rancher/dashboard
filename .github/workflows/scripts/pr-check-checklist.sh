#!/bin/bash
set -e

echo "Fetching description..."
PR_BODY=$(curl -s -H "Authorization: Bearer $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  "$PR_URL" | jq -r '.body')

echo "Validating checklist..."
CHECKBOXES=$(echo "$PR_BODY" | grep -o '\[.\]')
UNCHECKED=$(echo "$CHECKBOXES" | grep '\[ \]' || true)

if [ -n "$UNCHECKED" ]; then
  echo "❌ Checklist has not been completed"
  exit 1
else
  echo "✅ Checked Checklist, all checks checked and checked"
fi