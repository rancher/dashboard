#!/usr/bin/env bash

# Quick TypeScript check script for shell package
# This checks for type errors that would appear during extension builds

set -e

SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
BASE_DIR="$(git rev-parse --show-toplevel)"
SHELL_DIR=$BASE_DIR/shell

echo "🔍 Quick TypeScript check for shell package..."
echo ""

cd "${SHELL_DIR}"

# Run TypeScript compiler in noEmit mode to check for errors
echo "Running TypeScript compiler..."
${BASE_DIR}/node_modules/.bin/tsc --noEmit

echo ""
echo "✅ No TypeScript errors found!"
