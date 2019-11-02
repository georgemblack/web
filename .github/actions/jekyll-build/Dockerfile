FROM ubuntu:18.04

RUN apt-get update && \
    apt-get install -y make gcc g++ ruby-full

RUN gem install bundler

COPY entrypoint.sh /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]