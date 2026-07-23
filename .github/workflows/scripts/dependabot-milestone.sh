#!/usr/bin/env bash
set -eo pipefail

# Assigns the branch-derived milestone to Dependabot pull requests.
#
# The milestone for a PR is derived from its base branch using the canonical
# helper `scripts/get-branch-metadata.sh` (which reads branches-metadata.json).
# This mirrors the validation performed by `pr-check-milestone.sh`, so assigning
# the milestone here lets Dependabot PRs pass that check automatically.
#
# Modes (via the MODE environment variable):
#   event (default) - assign the milestone to the single PR given by PR_NUMBER
#                     (base branch BASE_REF), read from the workflow event.
#   sweep           - assign the milestone to every open Dependabot PR.
#
# The branch-derived milestone is always (re)applied to the target open PR(s).
#
# Environment:
#   GH_TOKEN            - token with pull-requests:write (required, used by gh)
#   GITHUB_REPOSITORY   - 'owner/repo' (provided by the Actions runner)
#   MODE                - 'event' or 'sweep' (default 'event')
#   PR_NUMBER, BASE_REF - required in event mode
#   METADATA_LOCAL      - when 'true', read the checked-out branches-metadata.json
#                         instead of fetching it from the master branch

# Configuration (all overridable via the environment; defaults suit local runs)
GITHUB_REPOSITORY=${GITHUB_REPOSITORY:-rancher/dashboard}
MODE=${MODE:-event}
# GitHub search/author handle for the Dependabot app (used to filter PRs)
DEPENDABOT_AUTHOR="app/dependabot"

# By default get-branch-metadata.sh fetches the metadata from the master branch;
# '--local' makes it read the checked-out branches-metadata.json instead.
METADATA_FLAG=""
if [ "$METADATA_LOCAL" = "true" ]; then
  METADATA_FLAG="--local"
fi

# Resolve the milestone version for a branch via the canonical helper.
# Echoes the version (empty if the branch has no milestone / is unknown).
milestone_for_branch() {
  local branch="$1"
  local data version

  # The helper exits non-zero for an unknown branch; treat that as "no milestone"
  if data=$(./scripts/get-branch-metadata.sh $METADATA_FLAG "$branch" 2>/dev/null); then
    # Metadata found - pull the milestone version out of the JSON
    version=$(echo "$data" | jq -r '.milestone.version // ""')
  else
    version=""
  fi

  echo "$version"
}

# Assign the branch-derived milestone to a single PR
assign_milestone() {
  local number="$1"
  local branch="$2"
  local version

  version=$(milestone_for_branch "$branch")

  # A branch with no configured milestone (e.g. a feature branch) is skipped
  if [ -z "$version" ]; then
    echo "  PR #${number}: no milestone found for base branch '${branch}', skipping"
    return 0
  fi

  # '--milestone' takes the milestone title; re-applying the same one is a no-op
  echo "  PR #${number}: setting milestone to '${version}' (base branch '${branch}')"
  gh pr edit "$number" --repo "$GITHUB_REPOSITORY" --milestone "$version"
}

if [ "$MODE" = "sweep" ]; then
  # Safety-net path: find every open Dependabot PR and (re)apply its milestone.
  echo "Sweeping all open Dependabot pull requests in ${GITHUB_REPOSITORY}..."

  # Fetch the list up front. Under 'set -e' a failure here (auth / API error)
  # aborts the job loudly instead of being silently swallowed by a pipeline.
  pr_list=$(gh pr list --repo "$GITHUB_REPOSITORY" --state open --author "$DEPENDABOT_AUTHOR" \
    --limit 200 --json number,baseRefName --jq '.[] | [.number, .baseRefName] | @tsv')

  # Process each PR ("<number>\t<baseBranch>"). Keep going past a single PR's
  # failure so one bad PR can't stop the rest of the sweep; report at the end.
  failed=0
  while IFS=$'\t' read -r number branch; do
    [ -z "$number" ] && continue
    echo "Processing Dependabot PR #${number}"
    assign_milestone "$number" "$branch" || {
      echo "  ⚠️  PR #${number}: failed to set milestone, continuing"
      failed=1
    }
  done <<< "$pr_list"

  if [ "$failed" != "0" ]; then
    echo "❌ One or more Dependabot PRs could not be updated" >&2
    exit 1
  fi
else
  # Event path: assign the milestone to the one PR from the triggering event.
  if [ -z "$PR_NUMBER" ] || [ -z "$BASE_REF" ]; then
    echo "❌ PR_NUMBER and BASE_REF must be set in event mode" >&2
    exit 1
  fi

  echo "Processing Dependabot PR #${PR_NUMBER} (base branch '${BASE_REF}')"
  assign_milestone "$PR_NUMBER" "$BASE_REF"
fi
