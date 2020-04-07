#!/bin/sh

set -e

sanitize() {
  if [ -z "${1}" ]
  then
    >&2 echo "Unable to find ${2}. Did you configure your workflow correctly?"
    exit 1
  fi
}

sanitize "${INPUT_PROJECTID}" "projectId"
sanitize "${INPUT_BUCKETNAME}" "bucketName"
sanitize "${GCLOUD_AUTH}" "GCLOUD_AUTH"

# Set defaults
PROJECT_ID=${INPUT_PROJECTID}
BUCKET_NAME=${INPUT_BUCKETNAME}

# Set project
gcloud config set project ${PROJECT_ID}

# Auth w/service account
echo ${GCLOUD_AUTH} | base64 --decode > ./key.json
gcloud auth activate-service-account --key-file=./key.json
rm ./key.json

# Upload dir
gsutil -m rsync -r -d -x ".*assets/.*$" ./sites/main/src/_site gs://${BUCKET_NAME}
