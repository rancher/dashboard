#!/usr/bin/env bash
#
# Tests for evaluate-gate.sh. Run directly: ./evaluate-gate.test.sh
#
# The gate is the repository's only required status check, so a bug that makes
# it pass unconditionally silently removes all branch protection, and a bug that
# makes it hang on `skipped` stalls the merge queue for everyone.

set -uo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GATE="$HERE/evaluate-gate.sh"

pass=0
fail=0

# expect <name> <expected-exit> <needs-json> [skippable] [soft]
expect() {
  local name="$1" want="$2" needs="$3" skippable="${4:-}" soft="${5:-}"
  local out got

  out="$(NEEDS="$needs" SKIPPABLE="$skippable" SOFT="$soft" "$GATE" 2>&1)"
  got=$?

  if [ "$got" -eq "$want" ]; then
    pass=$((pass + 1))
    printf 'ok   %s\n' "$name"
  else
    fail=$((fail + 1))
    printf 'FAIL %s (want exit %s, got %s)\n' "$name" "$want" "$got"
    printf '     %s\n' "$out"
  fi
}

# expect_output <name> <substring> <needs-json> [skippable] [soft]
expect_output() {
  local name="$1" want="$2" needs="$3" skippable="${4:-}" soft="${5:-}"
  local out

  out="$(NEEDS="$needs" SKIPPABLE="$skippable" SOFT="$soft" "$GATE" 2>&1)"

  if grep -qF -- "$want" <<<"$out"; then
    pass=$((pass + 1))
    printf 'ok   %s\n' "$name"
  else
    fail=$((fail + 1))
    printf 'FAIL %s (output missing %q)\n' "$name" "$want"
    printf '     %s\n' "$out"
  fi
}

r() { printf '{"result":"%s"}' "$1"; }

ALL_SKIPPABLE='e2e-test a11y-test check-i18n'

# --- the two everyday paths ------------------------------------------------

expect 'pull_request: everything green' 0 \
  "{\"lint\":$(r success),\"e2e-test\":$(r success)}" "$ALL_SKIPPABLE"

expect 'merge_group: light set green, PR-only skipped' 0 \
  "{\"lint\":$(r success),\"unit-test\":$(r success),\"e2e-test\":$(r skipped),\"a11y-test\":$(r skipped)}" \
  "$ALL_SKIPPABLE"

# --- the regressions the gate exists to catch ------------------------------

expect 'merge_group: lint regression blocks' 1 \
  "{\"lint\":$(r failure),\"e2e-test\":$(r skipped)}" "$ALL_SKIPPABLE"

expect 'pull_request: e2e failure blocks' 1 \
  "{\"lint\":$(r success),\"e2e-test\":$(r failure)}" "$ALL_SKIPPABLE"

# A skipped job is not a success for a required check. If a job that must run on
# every event is skipped, that is a misconfiguration, not a pass.
expect 'non-skippable job skipped blocks' 1 \
  "{\"lint\":$(r skipped)}" "$ALL_SKIPPABLE"

# A cancelled merge-group run must never read green — the queue would merge it.
expect 'cancelled blocks' 1 \
  "{\"lint\":$(r cancelled)}" "$ALL_SKIPPABLE"

expect 'timed_out blocks' 1 \
  "{\"lint\":$(r timed_out)}" "$ALL_SKIPPABLE"

# --- soft mode -------------------------------------------------------------

expect 'soft job failure does not block' 0 \
  "{\"lint\":$(r success),\"a11y-test\":$(r failure)}" "$ALL_SKIPPABLE" 'a11y-test'

expect_output 'soft job failure is announced' '::warning::a11y-test' \
  "{\"lint\":$(r success),\"a11y-test\":$(r failure)}" "$ALL_SKIPPABLE" 'a11y-test'

expect 'soft does not excuse a different job' 1 \
  "{\"lint\":$(r failure),\"a11y-test\":$(r failure)}" "$ALL_SKIPPABLE" 'a11y-test'

# --- guards against a silently-toothless gate ------------------------------

expect 'empty needs blocks' 1 '{}' "$ALL_SKIPPABLE"
expect 'malformed needs blocks' 1 'not json' "$ALL_SKIPPABLE"
expect 'missing result field blocks' 1 '{"lint":{}}' "$ALL_SKIPPABLE"

# Both directions of partial matching, because they fail differently.
#
# Long job id against a short list entry. Note this one passes even under a
# plain substring match — the needle is longer than the haystack — so on its own
# it proves nothing. It is kept only to pin the pair.
expect 'skippable matches whole words only' 1 \
  "{\"check-i18n-links\":$(r skipped)}" 'check-i18n'

# Short job id against a long list entry: the direction that actually broke.
# `grep -w i18n` matches inside `check-i18n` because `-` is not a word
# constituent, which silently excused a skipped `i18n` — one of the four
# always-on merge-queue checks — under the real ci-gate config.
expect 'skippable does not excuse a job that is a suffix of an entry' 1 \
  "{\"i18n\":$(r skipped)}" 'check-i18n check-i18n-links'

# Same flaw, soft path.
expect 'soft does not excuse a job that is a suffix of an entry' 1 \
  "{\"i18n\":$(r failure)}" '' 'check-i18n'

# A jq error inside the results loop must block. `[1,2]` is valid JSON with
# non-empty `keys`, so it clears the guards above, but `.value.result` errors —
# which used to yield zero loop iterations and a green gate.
expect 'jq failure while reading results blocks' 1 '[1,2]' "$ALL_SKIPPABLE"

printf '\n%s passed, %s failed\n' "$pass" "$fail"
[ "$fail" -eq 0 ]
