#!/usr/bin/env bash
set -euo pipefail

# Roll the comments-only CODEOWNERS file out to the Rancher UI repositories.
#
# The repository list is read from .github/OWNERS.md and the file contents are
# read from .github/CODEOWNERS, so this script cannot drift from either.
#
# .github/OWNERS.md is public and lists only the public repositories. The private
# ones are listed in the same format in a private repository, which that document
# explains how to find; pass --owners to roll the file out to those.
#
# Runs as a dry run unless --apply is given. Requires the `gh` CLI, authenticated
# with push access to the target repositories.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

OWNERS_FILE="${REPO_ROOT}/.github/OWNERS.md"
TEMPLATE_FILE="${REPO_ROOT}/.github/CODEOWNERS"

TARGET_PATH=".github/CODEOWNERS"
BRANCH="add-codeowners"
OWNERS_URL="https://github.com/rancher/dashboard/blob/master/.github/OWNERS.md"

APPLY=false
ONLY_REPO=""

usage() {
    cat <<EOF
Usage: $(basename "$0") [--apply] [--repo <owner/name>] [--owners <file>]

  --apply           Create the branch, commit and pull request. Without this the
                    script only reports what it would do.
  --repo <name>     Restrict to a single repository, e.g. rancher/icons.
  --owners <file>   Read the repository list from <file> instead of
                    .github/OWNERS.md. Use this with the team's private owners
                    list, which is in the same format. See .github/OWNERS.md for
                    where that list lives.
  -h, --help        Show this help.

Archived repositories, repositories that already have a CODEOWNERS file, and
repositories you cannot see or push to are skipped.
EOF
}

while [ $# -gt 0 ]; do
    case "$1" in
        --apply)
            APPLY=true
            shift
            ;;
        --repo)
            ONLY_REPO="${2:-}"
            if [ -z "$ONLY_REPO" ]; then
                echo "error: --repo requires a value" >&2
                exit 1
            fi
            shift 2
            ;;
        --owners)
            OWNERS_FILE="${2:-}"
            if [ -z "$OWNERS_FILE" ]; then
                echo "error: --owners requires a value" >&2
                exit 1
            fi
            shift 2
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            echo "error: unknown argument '$1'" >&2
            usage >&2
            exit 1
            ;;
    esac
done

# 1. Preconditions

for file in "$OWNERS_FILE" "$TEMPLATE_FILE"; do
    if [ ! -r "$file" ]; then
        echo "error: cannot read ${file}" >&2
        exit 1
    fi
done

if ! command -v gh >/dev/null 2>&1; then
    echo "error: the 'gh' CLI is required but was not found on PATH" >&2
    exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
    echo "error: 'gh' is not authenticated, run 'gh auth login'" >&2
    exit 1
fi

# 2. Collect the repositories the UI team owns from the owners list
#
# Only the table under the "Repositories owned by" heading is read, so any later
# section is left out of the rollout. The internal list uses the same heading and
# table format, so --owners needs no other change.

collect_repos() {
    awk '
        /^## Repositories owned by/ { collect = 1; next }
        /^## /                      { collect = 0; next }
        collect && /^\| \[`[^`]+`\]/ {
            match($0, /`[^`]+`/)
            print substr($0, RSTART + 1, RLENGTH - 2)
        }
    ' "$OWNERS_FILE"
}

REPOS=()
while IFS= read -r repo; do
    [ -n "$repo" ] || continue
    if [ -n "$ONLY_REPO" ] && [ "$repo" != "$ONLY_REPO" ]; then
        continue
    fi
    REPOS+=("$repo")
done < <(collect_repos)

if [ ${#REPOS[@]} -eq 0 ]; then
    if [ -n "$ONLY_REPO" ]; then
        echo "error: '${ONLY_REPO}' is not an owned repository in ${OWNERS_FILE}" >&2
    else
        echo "error: no repositories found in ${OWNERS_FILE}" >&2
    fi
    exit 1
fi

# 3. Walk the repositories

created=0
skipped_archived=0
skipped_existing=0
skipped_no_access=0
skipped_not_visible=0
failed=0

if [ "$APPLY" = false ]; then
    echo "Dry run. Re-run with --apply to open the pull requests."
    echo
fi

existing_codeowners() {
    local repo="$1" candidate
    for candidate in CODEOWNERS .github/CODEOWNERS docs/CODEOWNERS; do
        if gh api "repos/${repo}/contents/${candidate}" --jq .path >/dev/null 2>&1; then
            echo "$candidate"
            return 0
        fi
    done
    return 0
}

apply_to_repo() {
    local repo="$1" base="$2" base_sha content

    base_sha="$(gh api "repos/${repo}/git/ref/heads/${base}" --jq .object.sha)"

    gh api "repos/${repo}/git/refs" \
        -f "ref=refs/heads/${BRANCH}" \
        -f "sha=${base_sha}" >/dev/null

    # -w0 is GNU coreutils, BSD/macOS base64 does not wrap by default
    if base64 --help 2>&1 | grep -q -- '-w'; then
        content="$(base64 -w0 < "$TEMPLATE_FILE")"
    else
        content="$(base64 < "$TEMPLATE_FILE" | tr -d '\n')"
    fi

    gh api --method PUT "repos/${repo}/contents/${TARGET_PATH}" \
        -f "message=Add CODEOWNERS pointing at the Rancher UI owners list" \
        -f "content=${content}" \
        -f "branch=${BRANCH}" >/dev/null

    gh api "repos/${repo}/pulls" \
        -f "title=Add CODEOWNERS pointing at the Rancher UI owners list" \
        -f "head=${BRANCH}" \
        -f "base=${base}" \
        -f "body=$(pr_body)" \
        --jq .html_url
}

pr_body() {
    cat <<EOF
Adds a \`CODEOWNERS\` file for this repository.

The file contains only comments. GitHub automatically requests a review from
every code owner matched by a pull request and that cannot be disabled, so
declaring owner rules here would generate review requests the team cannot act
on. A comments-only file is still a valid \`CODEOWNERS\` file.

Ownership is instead recorded in the Rancher UI owners list, which the file
points at:
${OWNERS_URL}
EOF
}

for repo in "${REPOS[@]}"; do
    printf '%-42s' "$repo"

    # A private repository nobody on the UI team can see reads the same as one
    # that does not exist, so this is a skip rather than a failure
    if ! meta="$(gh api "repos/${repo}" --jq '[(.archived|tostring), .default_branch, (.permissions.push|tostring)] | join(" ")' 2>/dev/null)"; then
        echo "skipped  not visible, private or does not exist"
        skipped_not_visible=$((skipped_not_visible + 1))
        continue
    fi

    read -r archived default_branch can_push <<<"$meta"

    if [ "$archived" = "true" ]; then
        echo "skipped  archived"
        skipped_archived=$((skipped_archived + 1))
        continue
    fi

    if [ -z "$default_branch" ]; then
        echo "FAILED   no default branch"
        failed=$((failed + 1))
        continue
    fi

    found="$(existing_codeowners "$repo")"
    if [ -n "$found" ]; then
        echo "skipped  already has ${found}"
        skipped_existing=$((skipped_existing + 1))
        continue
    fi

    # Repositories in other orgs need somebody with push access there to run this
    if [ "$can_push" != "true" ]; then
        echo "skipped  no push access"
        skipped_no_access=$((skipped_no_access + 1))
        continue
    fi

    if [ "$APPLY" = false ]; then
        echo "would add ${TARGET_PATH} on branch '${BRANCH}' off '${default_branch}'"
        created=$((created + 1))
        continue
    fi

    if url="$(apply_to_repo "$repo" "$default_branch")"; then
        echo "created  ${url}"
        created=$((created + 1))
    else
        echo "FAILED   see error above"
        failed=$((failed + 1))
    fi
done

# 4. Summary

echo
if [ "$APPLY" = true ]; then
    echo "created:           ${created}"
else
    echo "would create:      ${created}"
fi
echo "skipped, archived: ${skipped_archived}"
echo "skipped, existing: ${skipped_existing}"
echo "skipped, no push:  ${skipped_no_access}"
echo "skipped, unseen:   ${skipped_not_visible}"
echo "failed:            ${failed}"

if [ "$skipped_no_access" -gt 0 ] || [ "$skipped_not_visible" -gt 0 ]; then
    echo
    echo "Repositories skipped for push access or visibility need somebody with"
    echo "write permission in that org to run this script."
fi

[ "$failed" -eq 0 ]
