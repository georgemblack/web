# Web Builder

Web Builder is a container that performs static site builds for [george.black](https://george.black). Its primary build function performs the following:

1. Fetch data from API
2. Use data to execute templates
3. Upload static files to host

## Running Locally

For running locally, you will need credentials with access to Google Cloud Storage. You may also need to set the environment:

```
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json
export ENVIRONMENT=staging
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

The following environment configurations are used (with dummy defaults):

```
PORT
CLOUD_STORAGE_BUCKET    # for uploading builds
API_ENDPOINT            # for auth with Web API
API_USERNAME
API_PASSWORD
```

## Infrastructure

The Web Builder runs as a service on Google Cloud Run. Authentication to trigger builds is provided by Google Cloud IAM.
