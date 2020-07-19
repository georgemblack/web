FROM golang:1.14 as build-env
WORKDIR /go/src/app
ADD . /go/src/app
RUN go build ./cmd/server/main.go

FROM gcr.io/distroless/base-debian10
WORKDIR /app
COPY --from=build-env /go/src/app/main ./main
COPY ./site ./site
CMD ["/app/main"]
