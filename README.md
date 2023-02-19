# Web Builder

Web Builder is a container that performs static site builds for [george.black](https://george.black). Its primary build function performs the following:

1. Fetch data from API
2. Use data to execute templates
3. Upload static files to host

## Running Locally

To start in Codespaces (until I figure out how to do this automatically):

```
export GOOGLE_APPLICATION_CREDENTIALS=google-application-credentials.json
export ENVIRONMENT=staging
echo "$GOOGLE_APPLICATION_CREDENTIALS_CONTENTS" > google-application-credentials.json
```

To start the mock API server:

```
cd mock
yarn && yarn start
```

To start the server locally, run:

```
go run ./cmd/server/main.go
```

Or perform a single build:

```
go run ./cmd/build/main.go
```

## Environment

All configuration can be defined in `.json` files in the `config` directory. Env vars override these values. In production the following env vars are required:

```
API_ENDPOINT
API_USERNAME
API_PASSWORD
```

## Infrastructure

The Web Builder runs as a service on Google Cloud Run. Authentication to trigger builds is provided by Google Cloud IAM.
