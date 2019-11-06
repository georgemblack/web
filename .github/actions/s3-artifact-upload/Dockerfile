FROM python:3.7-alpine3.9

RUN apk update && apk add zip tzdata
RUN pip install awscli

ENV TZ="America/Chicago"

COPY entrypoint.sh /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]