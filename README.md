# Web Builder

Web Builder is a container that performs static site builds for [georgeblack.me](https://georgeblack.me). Its primary build function performs the following:

1. Fetch data from API
2. Use data to execute templates
3. Upload static files to host

## Running Locally

Service requires following env vars:

```
PORT                    # default 9002
CLOUD_STORAGE_BUCKET
```

To authorize with build endpoint:

```
ADMIN_ORIGIN            # default *
USERNAME                # default test
PASSWORD                # default test
```

To authorize with data API:
```
API_ENDPOINT            # default http://localhost:9000
API_USERNAME            # default test
API_PASSWORD            # default test
```
