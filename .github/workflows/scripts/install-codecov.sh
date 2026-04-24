#!/bin/bash

VERSION=$1
CHECKSUM=$2

# Download keys, codecov and codecov checksum 
curl https://keybase.io/codecovsecurity/pgp_keys.asc | gpg --no-default-keyring --keyring trustedkeys.gpg --import # One-time step
curl -Os https://cli.codecov.io/${VERSION}/linux/codecov
curl -Os https://cli.codecov.io/${VERSION}/linux/codecov.SHA256SUM
curl -Os https://cli.codecov.io/${VERSION}/linux/codecov.SHA256SUM.sig
gpg --verify codecov.SHA256SUM.sig codecov.SHA256SUM

# Confirm downloaded codecov matches downloaded codecov checksum
shasum -a 256 -c codecov.SHA256SUM

# Confirm downloaded codecov matches provided codecov checksum
DOWNLOADED_CHECKSUM=$(sha256sum codecov | awk '{print $1}')
if [ "$DOWNLOADED_CHECKSUM" != "${CHECKSUM}" ]; then
  echo "Error: Checksum mismatch! Expected ${CHECKSUM} but got $DOWNLOADED_CHECKSUM"
  exit 1
fi

sudo chmod +x codecov