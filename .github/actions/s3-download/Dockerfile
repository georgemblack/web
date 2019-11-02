FROM python:3.7-alpine3.9

RUN pip install awscli

COPY entrypoint.sh /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]