# Web Builder

Web Builder is a container that performs static site builds for [georgeblack.me](https://georgeblack.me). Its primary build function performs the following steps:

1. Fetch data from API
2. Use data to execute templates
3. Upload static files to host

When running locally, the server will listen on `9002`.

Service requires following env vars:

```
PORT
CLOUD_STORAGE_BUCKET
```

To authorize with build endpoint:

```
ADMIN_ORIGIN
USERNAME
PASSWORD
```

To authorize with data API:
```
API_ENDPOINT
API_USERNAME
API_PASSWORD
```
