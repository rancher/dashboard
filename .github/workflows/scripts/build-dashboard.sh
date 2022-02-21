#!/bin/bash
set -e

echo "Building"
echo "yRELEASE_DIR: $RELEASE_DIR"
echo "GITHUB_SHA: $GITHUB_SHA"
echo "GITHUB_REF_NAME: $GITHUB_REF_NAME"
echo "yOUTPUT_DIR: $OUTPUT_DIR"
echo "yARTIFACT_NAME: $ARTIFACT_NAME"
echo "yROUTER:BASE: $ARTIFACT_NAME"
echo "RELEASE_DIR: $RELEASE_DIR"


# mkdir ${{ RELEASE_DIR }}
# yarn install --frozen-lockfile
# NUXT_ENV_commit=${GITHUB_SHA} NUXT_ENV_version=${GITHUB_REF_NAME} OUTPUT_DIR=${{ OUTPUT_DIR }}/${{ ARTIFACT_NAME }} ROUTER_BASE='/dashboard' RANCHER_ENV=desktop yarn run build --spa
# tar -czf ${{ RELEASE_DIR }}/${{ ARTIFACT_NAME }}.tar.gz -C ${{ OUTPUT_DIR }}/${{ ARTIFACT_NAME }} .
# sha512sum ${{ RELEASE_DIR }}/${{ ARTIFACT_NAME }}.tar.gz > ${{ RELEASE_DIR }}/${{ ARTIFACT_NAME }}.tar.gz.sha512sum
