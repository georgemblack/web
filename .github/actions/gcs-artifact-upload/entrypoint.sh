#!/bin/sh

set -e

sanitize() {
  if [ -z "${1}" ]
  then
    >&2 echo "Unable to find ${2}. Did you configure your workflow correctly?"
    exit 1
  fi
}

sanitize "${INPUT_GCLOUDPROJECTID}" "gcloudProjectId"
sanitize "${INPUT_GCLOUDSERVICEACCOUNT}" "gcloudServiceAccount"
sanitize "${INPUT_GCSURI}" "gcsUri"
sanitize "${INPUT_LOCALPATH}" "localPath"
sanitize "${GCLOUD_AUTH}" "GCLOUD_AUTH"

# Build zip
echo "Creating zip with files in ${INPUT_LOCALPATH}"
TIMESTAMP=$(date +%Y-%m-%d)
ARTIFACT_NAME=${TIMESTAMP}-snapshot.zip
cd ${INPUT_LOCALPATH}
zip -r ${GITHUB_WORKSPACE}/${ARTIFACT_NAME} ./*
cd ${GITHUB_WORKSPACE}

# Auth w/service account
echo "Authorizing with GCP service account"
gcloud config set project ${INPUT_GCLOUDPROJECTID}
echo ${GCLOUD_AUTH} | base64 --decode > ./key.json
gcloud auth activate-service-account --key-file=./key.json
rm ./key.json

echo "Uploading ${ARTIFACT_NAME} to GCS"
gsutil cp ./${ARTIFACT_NAME} ${INPUT_GCSURI}/${ARTIFACT_NAME}

echo "Deleting local ${ARTIFACT_NAME}"
rm ./${ARTIFACT_NAME}
