
pushd cd ..
yarn --pure-lockfile install
popd

source scripts/version

if [[ $COMMIT_BRANCH == "master" ]]; then
  VERSION="latest"
fi

echo "COMMIT_BRANCH: ${COMMIT_BRANCH}"

# package, override version, commit for file in pkg root
COMMIT=$COMMIT COMMIT_BRANCH=$COMMIT_BRANCH VERSION=$VERSION ./build-pkg ${1} "true"
EXIT_CODE=$?

echo "DRONE_PKG_VERSION: ${DRONE_PKG_VERSION}"
echo "DRONE_PKG_VERSION_TAR: ${DRONE_PKG_VERSION_TAR}"

exit $EXIT_CODE