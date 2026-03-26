#!/bin/bash

# Shared utilities for Jenkins CI scripts

# Wrapper for corral to strip logging prefixes while maintaining debug visibility
# and ensuring exit codes are preserved.
clean_corral() {
  # Enable pipefail so the exit code of 'corral' is returned, not 'sed'
  set -o pipefail
  
  # 1. Strips time=... level=... msg=... style structured logging first
  # 2. Strips [hostname-etc]: style prefixes from the resulting message
  # 3. Strips [0000] numeric timestamp prefixes
  # 4. Uses sed (without -u for BusyBox compatibility)
  corral "$@" 2>&1 | sed \
    -e 's/time="[^"]*" //' \
    -e 's/level=[a-z]* //' \
    -e 's/msg="//' \
    -e 's/"$//' \
    -e 's/\\"/"/g' \
    -e 's/^[[:space:]]*\[[^]]*\]:[[:space:]]*//' \
    -e 's/^\[[0-9]\{4\}\] //'
    
  local exit_code=$?
  set +o pipefail
  return $exit_code
}

# Cleans and normalizes Cypress tags:
# 1. Removes the @bypass magic tag
# 2. Converts spaces to + (AND logic)
# 3. Collapses multiple + into one
# 4. Trims leading/trailing +
clean_tags() {
  local tags="$1"
  echo "${tags}" | sed -e 's/@bypass//g' -e 's/[[:space:]][[:space:]]*/+/g' -e 's/++*/+/g' -e 's/^+//' -e 's/+$//'
}
