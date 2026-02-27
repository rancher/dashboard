#!/usr/bin/env bash

# Local test script to reproduce the plugin build errors from CI
# This mimics what happens in test-plugins-build.sh but runs locally

set -e

SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
BASE_DIR="$( cd $SCRIPT_DIR && cd ../.. & pwd)"
TEST_DIR="${BASE_DIR}/test-plugin-local"

echo "🧪 Testing plugin build locally (simulating CI)..."
echo ""

# Clean up any previous test
rm -rf "${TEST_DIR}"
mkdir -p "${TEST_DIR}"

cd "${BASE_DIR}"

echo "📦 Building shell package types..."
bash shell/scripts/typegen.sh

echo ""
echo "📝 Creating test extension..."
cd "${TEST_DIR}"

# Create a minimal test package that uses the shell types
yarn create @rancher/extension test-pkg --app-name test-app

cd test-app

echo ""
echo "📚 Installing dependencies..."
yarn install

# Point to local shell for testing if you want
# yarn link @rancher/shell

echo ""
echo "🔨 Building test package (this is where errors would show)..."
set -o pipefail
yarn build-pkg test-pkg 2>&1 | tee build.log || {
  echo ""
  echo "❌ Build failed! Check errors above."
  echo "This matches what you see in CI."
  exit 1
}

echo ""
echo "✅ Build succeeded! No TypeScript errors found."
echo ""
echo "To clean up: rm -rf ${TEST_DIR}"
