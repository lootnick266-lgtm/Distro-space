FROM golang:1.25-alpine

WORKDIR /app

COPY VKAlerts/go.mod VKAlerts/go.sum ./
RUN go mod download

COPY VKAlerts/ ./

RUN go build -o bot .

CMD ["./bot"]
