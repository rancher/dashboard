#!/usr/bin/env bash

# Release line helpers shared by the Shell/creators publish path.
#
# From Rancher 2.17 the package major encodes the Rancher line it belongs to: 217.0.1 is for
# Rancher 2.17. That makes the npm dist-tag derivable from the version alone, which is only
# safe because .github/workflows/scripts/check-package-tag-version.sh enforces that the
# version and the branch it is published from agree.
#
# Mirrors shellRancherLine() in shell/config/shell-version.js; keep the two in step.

# 217.0.1 -> 2.17. Empty for anything that does not name a release line.
release_line_from_version() {
  local version="$1"

  if [[ $version =~ ^2([0-9]{2,})\. ]]; then
    echo "2.${BASH_REMATCH[1]}"
  fi
}

# 217.0.1 -> rancher-2.17, 217.0.1-rc.1 -> rancher-2.17-pre-release.
#
# Versions from before the scheme, and the throwaway versions used when publishing to a local
# registry in tests, keep the global labels. Publishing one of those to the public registry is
# refused by publish-shell.sh rather than silently landing on `latest`.
npm_dist_tag() {
  local version="$1"
  local line
  local base="latest"

  line=$(release_line_from_version "$version")

  if [ -n "$line" ]; then
    base="rancher-${line}"
  fi

  if [[ $version != *"-"* ]]; then
    echo "$base"
  elif [ "$base" == "latest" ]; then
    echo "pre-release"
  else
    echo "${base}-pre-release"
  fi
}

# Allow the helpers to be exercised directly, e.g. `release-line.sh npm_dist_tag 217.0.1`
if [ "${BASH_SOURCE[0]}" == "${0}" ]; then
  "$@"
fi
