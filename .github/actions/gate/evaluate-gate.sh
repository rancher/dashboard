#!/usr/bin/env bash
#
# Evaluate an aggregate gate job's `needs` results.
#
# Reads:
#   NEEDS      required  the calling job's `needs` context as JSON
#   SKIPPABLE  optional  space-separated job ids allowed to report `skipped`
#   SOFT       optional  space-separated job ids whose failure warns, not blocks
#
# Exits 0 if every dependency is acceptable, 1 otherwise.
#
# GitHub evaluates required status checks twice under a merge queue:
#    1: on the pull request to enter
#    2: on the merge group to merge
# Using the same context names, and a `skipped` job is not a success for a
# required check. Aggregating the expensive PR-only jobs behind one
# always-running job is what allows the merge queue to run a reduced check set
# without stalling.

set -uo pipefail

NEEDS="${NEEDS:-}"
SKIPPABLE="${SKIPPABLE:-}"
SOFT="${SOFT:-}"

if ! jq -e . >/dev/null 2>&1 <<<"$NEEDS"; then
  echo "::error::gate: NEEDS is not valid JSON."
  exit 1
fi

# A gate guarding nothing would report a cheerful green forever. That is the
# failure mode this whole design exists to avoid, so treat it as fatal.
if [ -z "$(jq -r 'keys[]?' <<<"$NEEDS")" ]; then
  echo "::error::gate: received an empty \`needs\` context — it is guarding nothing."
  exit 1
fi

# Exact, whole-token membership test. `grep -w` is not a substitute here: `-` is
# not a word-constituent character, so `grep -w i18n` matches inside the entry
# `check-i18n` and would quietly excuse a required job that merely shares a
# suffix with a skippable one.
in_list() {
  local needle=$1 item
  for item in $2; do
    [ "$item" = "$needle" ] && return 0
  done
  return 1
}

# `jq` failing must never read as "no problems found". Capture its output and
# status up front rather than streaming straight into the loop: a process
# substitution that errors yields zero iterations, leaving `fail=0` and exiting
# the gate green — the silently toothless gate this design exists to avoid.
if ! entries=$(jq -r 'to_entries[] | "\(.key) \(.value.result // "missing")"' <<<"$NEEDS"); then
  echo "::error::gate: could not read job results from the \`needs\` context."
  exit 1
fi

# Belt and braces: jq can emit partial output before failing, so also insist on
# one line per dependency.
expected=$(jq -r 'keys | length' <<<"$NEEDS")
actual=$(grep -c . <<<"$entries")
if [ "$actual" -ne "$expected" ]; then
  echo "::error::gate: expected $expected job results from the \`needs\` context, parsed $actual."
  exit 1
fi

fail=0

while read -r job result; do
  case "$result" in
    success)
      echo "ok        $job"
      ;;
    skipped)
      if in_list "$job" "$SKIPPABLE"; then
        echo "skipped   $job (allowed)"
      else
        echo "::error::$job was skipped, but it is required on every event."
        fail=1
      fi
      ;;
    *)
      # Covers failure, cancelled and timed_out. `cancelled` must be fatal: a
      # cancelled merge-group run must never be reported as green.
      if in_list "$job" "$SOFT"; then
        echo "::warning::$job concluded '$result' (advisory, not blocking)"
      else
        echo "::error::$job concluded '$result'"
        fail=1
      fi
      ;;
  esac
done <<<"$entries"

if [ "$fail" -ne 0 ]; then
  echo "::error::gate failed. See the individual job results above."
  exit 1
fi

echo "gate: all checks satisfied for event '${GITHUB_EVENT_NAME:-unknown}'."
