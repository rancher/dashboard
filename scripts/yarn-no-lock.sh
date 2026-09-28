#!/bin/bash

set -x

COMMAND="install"
if [ "$1" == "install" ] || [ "$1" == "upgrade" ] || [ "$1" == "add" ]; then
  COMMAND="$1"
  shift
fi

# Backup the current .yarnrc
cp .yarnrc .yarnrc.bak

# Ensure the original .yarnrc is restored regardless of how the script exits (e.g., Ctrl+C)
trap 'mv .yarnrc.bak .yarnrc' EXIT

# Remove the frozen-lockfile constraint from the active .yarnrc
grep -v "frozen-lockfile" .yarnrc.bak > .yarnrc || true

# Run yarn command
yarn $COMMAND "$@"
