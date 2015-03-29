#!/bin/bash

PACKAGE_NAME=markdown-here
MOZILLA_PACKAGE_NAME=${PACKAGE_NAME}-mozilla.xpi
CHROME_PACKAGE_NAME=${PACKAGE_NAME}-chrome.zip
DIST_DIR=dist
SRC_DIR=src
TEST_DIR=${SRC_DIR}/common/test

MOZILLA_INPUT="chrome.manifest install.rdf common firefox"
CHROME_INPUT="manifest.json common chrome _locales"

ZIP_ARGS="-r -1"

rm -rf "${DIST_DIR}"
rm -rf "${TEST_DIR}"
find . -name "desktop.ini" -or -name ".*" -and -not -name "." -and -not -name ".git*" -print0 | xargs -0 rm -rf

mkdir ${DIST_DIR}

cd ${SRC_DIR}

zip ${ZIP_ARGS} "../${DIST_DIR}/${CHROME_PACKAGE_NAME}" ${CHROME_INPUT}

zip ${ZIP_ARGS} "../${DIST_DIR}/${MOZILLA_PACKAGE_NAME}" ${MOZILLA_INPUT}

cd -

git checkout -- "${TEST_DIR}"
