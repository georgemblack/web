FROM python:3.7-alpine3.9

RUN apk update && apk add zip
RUN pip install awscli

COPY entrypoint.sh /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]