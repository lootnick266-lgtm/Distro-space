FROM golang:1.25-alpine

WORKDIR /app

COPY ./VKAlerts/go.mod ./VKAlerts/go.sum ./
RUN go mod download

COPY ./VKAlerts .
COPY LICENSEfolder /app/LICENSEfolder

RUN go build -o bot VkAlertBot.go

CMD ["./bot"]
