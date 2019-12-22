FROM gcr.io/google.com/cloudsdktool/cloud-sdk:274.0.0

RUN apt update && apt install zip -y

ENV TZ="America/Chicago"

COPY entrypoint.sh /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
