#!/bin/bash

set -e

sanitize() {
  if [ -z "${1}" ]
  then
    >&2 echo "Unable to find ${2}. Did you configure your workflow correctly?"
    exit 1
  fi
}

sanitize "${INPUT_SOURCEDIRECTORY}" "sourceDirectory"

params=(
  --config=_config.yml,_config_prod.yml
)
if [[ -z INPUT_SOURCEDIRECTORY ]]; then
    params+=(-s ${GITHUB_WORKSPACE}/${INPUT_SOURCEDIRECTORY})
fi
if [[ -z INPUT_OUTPUTDIRECTORY ]]; then
    params+=(-o ${GITHUB_WORKSPACE}/${INPUT_OUTPUTDIRECTORY})
fi

bundle install --gemfile=${GITHUB_WORKSPACE}/${INPUT_SOURCEDIRECTORY}/Gemfile
bundle exec jekyll build "${params[@]}"
