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

echo "Creating zip with files in ${INPUT_LOCALPATH}"
TIMESTAMP=$(date +%Y-%m-%d)
ARTIFACT_NAME=${TIMESTAMP}.zip
cd ${INPUT_LOCALPATH}
zip -r ${GITHUB_WORKSPACE}/${ARTIFACT_NAME} ./*
cd ${GITHUB_WORKSPACE}

echo "Uploading ${ARTIFACT_NAME} to S3"
AWS_ACCESS_KEY_ID=${INPUT_AWSACCESSKEYID} AWS_SECRET_ACCESS_KEY=${INPUT_AWSSECRETACCESSKEY} aws s3 cp ./${ARTIFACT_NAME} ${INPUT_S3URI}/${ARTIFACT_NAME}

echo "Deleting local ${ARTIFACT_NAME}"
rm ./${ARTIFACT_NAME}