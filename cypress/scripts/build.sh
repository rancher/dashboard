#!/bin/bash
set -e
set -o pipefail

# Build script for @rancher/cypress package
# Run this script from the cypress/ directory

echo "Building @rancher/cypress package..."


# Move to the cypress root directory (one level up from scripts/)
cd "$(dirname "$0")/.."

# Clean previous builds
rm -rf dist/
rm -rf tmp/
mkdir -p dist/
mkdir -p tmp/

echo "Copying source files..."

# Copy the main package structure to a temporary directory for processing
cp -r e2e/ tmp/
cp -r support/ tmp/
cp base-config.ts tmp/
cp extend-config.ts tmp/
cp globals.d.ts tmp/

echo "Normalizing @/cypress imports..."

# Find all TypeScript files and replace @/cypress imports with relative paths
find tmp/ -name "*.ts" -type f | while read file; do
  # Calculate relative path from file to package root
  file_dir=$(dirname "$file")
  # Count directory depth to get back to dist/
  depth=$(echo "$file_dir" | sed 's|tmp/||' | sed 's|[^/]||g' | wc -c)
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

echo "Compiling TypeScript from tmp/ to dist/..."
npx tsc --project tsconfig.build.json

echo "Copying TypeScript source files to dist/..."
rsync -a --include='*/' --include='*.ts' --exclude='*' tmp/ dist/

echo "Copying non-TypeScript assets..."

cp package.json dist/
cp README.md dist/
cp .npmignore dist/
cp globals.d.ts dist/
cp -r bin dist/
cp -r template dist/

if [ "$1" == "--verify" ]; then
  echo ""
  echo "Package build verified"
  echo ""
else
  echo "Package built successfully in dist/ directory"
  echo ""
  echo "To test with yarn link:"
  echo "  cd dist"
  echo "  yarn install && yarn link"
  echo ""
  echo "Then in your other project:"
  echo "  yarn link '@rancher/cypress'"
  echo ""
fi
