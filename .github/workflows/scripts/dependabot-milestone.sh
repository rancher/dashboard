#!/usr/bin/env bash
set -eo pipefail

# Sets up Dependabot pull requests: assigns the branch-derived milestone and
# adds the auto-retry label so flaky test runs get retried automatically.
#
# The milestone for a PR is derived from its base branch using the canonical
# helper `scripts/get-branch-metadata.sh` (which reads branches-metadata.json).
# This mirrors the validation performed by `pr-check-milestone.sh`, so assigning
# the milestone here lets Dependabot PRs pass that check automatically.
#
# Modes (via the MODE environment variable):
#   event (default) - process the single PR given by PR_NUMBER (base BASE_REF),
#                     read from the workflow event.
#   sweep           - process every open Dependabot PR.
#
# The branch-derived milestone only ever moves a PR forward: it is applied when the
# PR has no milestone or an older version one, and never replaces a newer or
# non-version milestone someone set by hand (e.g. pushing a PR out to the next
# release). The retry label is always (re)applied to the target open PR(s).
#
# Environment:
#   GH_TOKEN            - token with pull-requests:write (required, used by gh)
#   GITHUB_REPOSITORY   - 'owner/repo' (provided by the Actions runner)
#   MODE                - 'event' or 'sweep' (default 'event')
#   PR_NUMBER, BASE_REF - required in event mode
#   RETRY_LABEL         - label added to trigger auto-retry (default bot/auto-retry/10)

# Configuration (all overridable via the environment; defaults suit local runs)
GITHUB_REPOSITORY=${GITHUB_REPOSITORY:-rancher/dashboard}
MODE=${MODE:-event}
# GitHub search/author handle for the Dependabot app (used to filter PRs)
DEPENDABOT_AUTHOR="app/dependabot"
# Label that tells the auto-retry workflow how many times to retry failed tests
RETRY_LABEL=${RETRY_LABEL:-bot/auto-retry/10}

# Resolve the milestone version for a branch via the canonical helper.
# Echoes the version (empty if the branch has no milestone / is unknown).
milestone_for_branch() {
  local branch="$1"
  local data version

  # The helper reads the canonical branches-metadata.json from master (the only copy we
  # maintain). It exits non-zero for an unknown branch; treat that as "no milestone".
  if data=$(./scripts/get-branch-metadata.sh "$branch" 2>/dev/null); then
    # Metadata found - pull the milestone version out of the JSON
    version=$(echo "$data" | jq -r '.milestone.version // ""')
  else
    version=""
  fi

  echo "$version"
}

# Succeeds when milestone title $1 is a strictly older version than $2 (both 'vX.Y.Z')
is_older_version() {
  local current="${1#v}"
  local target="${2#v}"

  [[ "$current" =~ ^[0-9]+(\.[0-9]+)*$ ]] || return 1
  [ "$current" != "$target" ] &&
    [ "$(printf '%s\n%s\n' "$current" "$target" | sort -V | head -n1)" = "$current" ]
}

# Assign the branch-derived milestone to a single PR, only moving it forward
assign_milestone() {
  local number="$1"
  local branch="$2"
  local current="$3"
  local version

  version=$(milestone_for_branch "$branch")

  # A branch with no configured milestone (e.g. a feature branch) is skipped
  if [ -z "$version" ]; then
    echo "  PR #${number}: no milestone found for base branch '${branch}', skipping"
    return 0
  fi

  if [ -n "$current" ] && ! is_older_version "$current" "$version"; then
    echo "  PR #${number}: keeping milestone '${current}' (branch milestone '${version}' is not newer)"
    return 0
  fi

  echo "  PR #${number}: setting milestone to '${version}' (base branch '${branch}', was '${current:-none}')"
  gh pr edit "$number" --repo "$GITHUB_REPOSITORY" --milestone "$version"
}

# Add the auto-retry label to a PR so failed test runs get retried automatically.
# Non-fatal: a missing label (e.g. on a fork) warns but does not fail the run.
add_retry_label() {
  local number="$1"

  echo "  PR #${number}: adding label '${RETRY_LABEL}'"
  gh pr edit "$number" --repo "$GITHUB_REPOSITORY" --add-label "$RETRY_LABEL" ||
    echo "  ⚠️  PR #${number}: could not add label '${RETRY_LABEL}' (does it exist in the repo?), continuing"
}

if [ "$MODE" = "sweep" ]; then
  # Safety-net path: find every open Dependabot PR and (re)apply its milestone.
  echo "Sweeping all open Dependabot pull requests in ${GITHUB_REPOSITORY}..."

  # Fetch the list up front. Under 'set -e' a failure here (auth / API error)
  # aborts the job loudly instead of being silently swallowed by a pipeline.
  pr_list=$(gh pr list --repo "$GITHUB_REPOSITORY" --state open --author "$DEPENDABOT_AUTHOR" \
    --limit 200 --json number,baseRefName,milestone \
    --jq '.[] | [.number, .baseRefName, (.milestone.title // "")] | @tsv')

  # Process each PR ("<number>\t<baseBranch>\t<milestone>"). Keep going past a single
  # PR's failure so one bad PR can't stop the rest of the sweep; report at the end.
  failed=0
  while IFS=$'\t' read -r number branch current; do
    [ -z "$number" ] && continue
    echo "Processing Dependabot PR #${number}"
    assign_milestone "$number" "$branch" "$current" || {
      echo "  ⚠️  PR #${number}: failed to set milestone, continuing"
      failed=1
    }
    add_retry_label "$number"
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

  # A reopened PR may already carry a milestone that must not be moved backwards
  current=$(gh pr view "$PR_NUMBER" --repo "$GITHUB_REPOSITORY" --json milestone --jq '.milestone.title // ""')

  echo "Processing Dependabot PR #${PR_NUMBER} (base branch '${BASE_REF}')"
  assign_milestone "$PR_NUMBER" "$BASE_REF" "$current"
  add_retry_label "$PR_NUMBER"
fi
