#!/bin/sh

set -e

sanitize() {
  if [ -z "${1}" ]
  then
    >&2 echo "Unable to find ${2}. Did you configure your workflow correctly?"
    exit 1
  fi
}

sanitize "${INPUT_SOURCEDIRECTORY}" "sourceDirectory"

cd ${GITHUB_WORKSPACE}/${INPUT_SOURCEDIRECTORY}
bundle install
bundle exec jekyll build --config=_config.yml,_config_prod.yml