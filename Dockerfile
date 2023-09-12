FROM golang:1.21 as build-env
WORKDIR /go/src/app
ADD . /go/src/app
RUN go build ./cmd/server/main.go

FROM golang:1.21
WORKDIR /app
COPY --from=build-env /go/src/app/main ./main
CMD ["/app/main"]
