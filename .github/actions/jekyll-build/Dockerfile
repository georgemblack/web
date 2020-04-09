FROM ruby:2.7.1

RUN gem install jekyll

COPY entrypoint.sh /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
