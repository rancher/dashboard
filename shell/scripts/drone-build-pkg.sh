#!/usr/bin/env bash

yarn --pure-lockfile install

source scripts/version

if [[ $COMMIT_BRANCH == "master" ]]; then
  VERSION="latest"
else
  VERSION=$(cd pkg/$1; node -p -e "require('./package.json').version")
fi

echo "Drone Build Args"
echo "COMMIT: ${COMMIT}"
echo "COMMIT_BRANCH: ${COMMIT_BRANCH}"
echo "VERSION: ${VERSION}"
echo ""

# package, override version, commit for file in pkg root
# Note - in the future env vars should be moved to args and build-pkg should use getopts
COMMIT=$COMMIT COMMIT_BRANCH=$COMMIT_BRANCH VERSION=$VERSION ./shell/scripts/build-pkg.sh ${1} "true"
EXIT_CODE=$?

export PKG_NAME=${1}-${VERSION}
export PKG_TARBALL=${PKG_NAME}.tar.gz

echo "Drone Build Artefacts"
echo "Package Directory: ${PKG_NAME}"
echo "Package Tarball: ${PKG_TARBALL}"

exit $EXIT_CODE