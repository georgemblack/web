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

# Auth w/service account
echo "Authorizing with GCP service account"
gcloud config set project ${INPUT_GCLOUDPROJECTID}
echo ${GCLOUD_AUTH} | base64 --decode > ./key.json
gcloud auth activate-service-account --key-file=./key.json
rm ./key.json

echo "Downloading from GCS"
gsutil -m cp -r ${INPUT_GCSURI} ${INPUT_LOCALPATH}
