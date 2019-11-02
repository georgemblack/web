#!/bin/sh

set -e

sanitize() {
  if [ -z "${1}" ]
  then
    >&2 echo "Unable to find ${2}. Did you configure your workflow correctly?"
    exit 1
  fi
}

sanitize "${INPUT_AWSACCESSKEYID}" "awsAccessKeyId"
sanitize "${INPUT_AWSSECRETACCESSKEY}" "awsSecretAccessKey"
sanitize "${INPUT_S3URI}" "s3Uri"
sanitize "${INPUT_LOCALPATH}" "localPath"

# Zip files with timestamp
TIMESTAMP=$(date +%Y-%m-%d)
ARTIFACT_PATH=./${TIMESTAMP}.zip 
zip -r ${ARTIFACT_PATH} ${INPUT_LOCALPATH}/*

# Upload to S3
AWS_ACCESS_KEY_ID=${INPUT_AWSACCESSKEYID} AWS_SECRET_ACCESS_KEY=${INPUT_AWSSECRETACCESSKEY} aws s3 sync ${ARTIFACT_PATH} ${INPUT_S3URI}

# Remove zip
rm ${ARTIFACT_PATH}