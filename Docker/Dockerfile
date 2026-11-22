FROM golang:1.25-alpine

WORKDIR /app

COPY Alerts/go.mod Alerts/go.sum ./
RUN go mod download

COPY Alerts/ ./

RUN go build -o bot .

CMD ["./bot"]
