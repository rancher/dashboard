#!/bin/bash

# Build script for @rancher/cypress package
# This script normalizes @/cypress imports to relative paths

echo "Building @rancher/cypress package..."

# Ensure we're in the cypress directory
cd "$(dirname "$0")"

# Clean previous builds
rm -rf dist/
mkdir -p dist/

echo "Copying source files..."

# Copy the main package structure
cp -r e2e/ dist/
cp -r support/ dist/
cp -r bin/ dist/
cp base-config.ts dist/
cp extend-config.ts dist/
cp globals.d.ts dist/
cp package.json dist/
cp README.md dist/

# Copy TypeScript config if needed
if [ -f tsconfig.json ]; then
  cp tsconfig.json dist/
fi

echo "Normalizing @/cypress imports..."

# Find all TypeScript files and replace @/cypress imports with relative paths
find dist/ -name "*.ts" -type f | while read file; do
  # Calculate relative path from file to package root
  file_dir=$(dirname "$file")
  # Count directory depth to get back to dist/
  depth=$(echo "$file_dir" | sed 's|dist/||' | sed 's|[^/]||g' | wc -c)
  depth=$((depth - 1))
  
  # Create relative path string (../ repeated depth times)
  if [ $depth -eq 0 ]; then
    relative_path="./"
  else
    relative_path="../"
    for i in $(seq 1 $depth); do
      relative_path="../$relative_path"
    done
  fi
  
  # Replace @/cypress/ with the relative path
  sed -i "s|@/cypress/|${relative_path}|g" "$file"
  # Also handle @/cypress without trailing slash
  sed -i "s|@/cypress|${relative_path}|g" "$file"
  # Replace ~/cypress/ with the relative path
  sed -i "s|~/cypress/|${relative_path}|g" "$file"
  # Also handle ~/cypress without trailing slash
  sed -i "s|~/cypress|${relative_path}|g" "$file"
done

echo "Package built successfully in dist/ directory"
echo "To test with yarn link:"
echo "  cd dist"
echo "  yarn link"
echo "Then in your other project:"
echo "  yarn link '@rancher/cypress'"