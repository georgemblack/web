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
if [[ -n "$INPUT_OUTPUTDIRECTORY" ]]; then
    params+=(-o ${GITHUB_WORKSPACE}/${INPUT_OUTPUTDIRECTORY})
fi

if [ -n "$INPUT_DIRECTORY" ]; then
  cd ${GITHUB_WORKSPACE}/${INPUT_DIRECTORY}
fi

bundle install
bundle exec jekyll build "${params[@]}"
