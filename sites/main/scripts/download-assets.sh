#!/bin/zsh

BUCKET_NAME="georgeblack.me"
BUCKET_PREFIX="assets"
SITE_BASE_DIR="."

mkdir -p ${SITE_BASE_DIR}/src/assets
gsutil -m rsync -r gs://${BUCKET_NAME}/${BUCKET_PREFIX} ${SITE_BASE_DIR}/src/assets
