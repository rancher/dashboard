#!/usr/bin/env bash
#
# disk-report.sh <before|after> - report agent disk usage around a build.
#
# The agent's disk is shared by every executor and by other jobs, and nothing
# reports what a build costs it. This prints a few lines at each end of a build
# so growth is attributable to the build that caused it.
#
# Read only, apart from a counter under /tmp used to print the delta.
#
set -uo pipefail

DISK_PHASE="${1:?usage: disk-report.sh <before|after>}"

ws="${WORKSPACE:-$PWD}"
tag="[disk:${DISK_PHASE}]"
stamp="/tmp/jenkins-disk-${EXECUTOR_NUMBER:-0}.before"

avail_kb=$(df -P "$ws" 2>/dev/null | awk 'NR==2 {print $4}')
avail_kb=${avail_kb:-0}

# The preflight guard measures the workspace, which may not be where images and
# cache actually live.
root=$(docker info --format '{{.DockerRootDir}}' 2>/dev/null)
if [ -n "$root" ]; then
  df -P "$root" 2>/dev/null |
    awk -v t="${tag}" -v r="$root" 'NR==2 {print t " docker root " r ": " int($4/1024/1024) "GB free of " int($2/1024/1024) "GB"}'
else
  df -P "$ws" 2>/dev/null |
    awk -v t="${tag}" 'NR==2 {print t " workspace: " int($4/1024/1024) "GB free of " int($2/1024/1024) "GB"}'
fi

# Totals rather than a catalogue. A build that reuses cached layers leaves these
# unchanged, so a jump between the two phases is this build's doing.
#
# Counted from the end because the type name is one word or two, and the
# percentage suffix on RECLAIMABLE is stripped first so every row has the same
# shape.
docker system df 2>/dev/null | sed 's/ ([0-9]*%)//' |
  awk -v t="${tag}" '
    $1 == "Images" || $1 == "Containers" { printf "%s %-11s %9s total, %9s reclaimable\n", t, $1, $(NF-1), $NF }
    $1 == "Build"                        { printf "%s %-11s %9s total, %9s reclaimable\n", t, "BuildCache", $(NF-1), $NF }' ||
  echo "${tag} docker unavailable"

if [ "${DISK_PHASE}" = "before" ]; then
  echo "${avail_kb}" > "${stamp}" 2>/dev/null || true
elif [ -f "${stamp}" ]; then
  before_kb=$(cat "${stamp}" 2>/dev/null || echo 0)
  if [ "${before_kb}" -gt 0 ] 2>/dev/null; then
    # Other executors share the disk, so this is net movement rather than this
    # build's own footprint, and may be negative.
    delta_mb=$(( (before_kb - avail_kb) / 1024 ))
    if [ "${delta_mb}" -ge 0 ]; then
      echo "${tag} net change over this build: ${delta_mb}MB consumed"
    else
      echo "${tag} net change over this build: $(( -delta_mb ))MB released"
    fi
  fi
  rm -f "${stamp}" 2>/dev/null || true
fi
exit 0
