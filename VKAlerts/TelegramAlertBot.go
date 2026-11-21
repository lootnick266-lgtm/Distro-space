package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"time"
)

var (
	telegramToken   string
	telegramChatID  string
	httpClient      = &http.Client{Timeout: 10 * time.Second}
	telegramAPIBase = "https://api.telegram.org"
)

func main() {
	telegramToken = os.Getenv("TELEGRAM_BOT_TOKEN")
	telegramChatID = os.Getenv("TELEGRAM_CHAT_ID")
	if telegramToken == "" || telegramChatID == "" {
		log.Fatal("TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID must be configured")
	}

	if err := sendNotification("Бот запущен!"); err != nil {
		log.Print("Telegram startup notification delivery failed")
	}
	log.Println("Telegram alert bot server starting")

	http.HandleFunc("/webhook", webhookHandler)
	server := &http.Server{Addr: ":8080", ReadHeaderTimeout: 5 * time.Second}
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Print("Telegram bot server failed to start")
	}
}

type alert struct {
	Status      string            `json:"status"`
	Labels      map[string]string `json:"labels"`
	Annotations map[string]string `json:"annotations"`
}

type AlertmanagerWebhook struct {
	Status string  `json:"status"`
	Alerts []alert `json:"alerts"`
}

type telegramMessageRequest struct {
	ChatID string `json:"chat_id"`
	Text   string `json:"text"`
}

type telegramAPIResponse struct {
	OK bool `json:"ok"`
}

var sendNotification = sendTelegramMessage

func sendTelegramMessage(message string) error {
	payload, err := json.Marshal(telegramMessageRequest{ChatID: telegramChatID, Text: message})
	if err != nil {
		return fmt.Errorf("encode Telegram message")
	}
	request, err := http.NewRequest(
		http.MethodPost,
		telegramAPIBase+"/bot"+telegramToken+"/sendMessage",
		bytes.NewReader(payload),
	)
	if err != nil {
		return fmt.Errorf("create Telegram request")
	}
	request.Header.Set("Content-Type", "application/json")
	response, err := httpClient.Do(request)
	if err != nil {
		// The error may include the token-bearing request URL; never return it to logs.
		return fmt.Errorf("send Telegram message")
	}
	defer response.Body.Close()
	if response.StatusCode < 200 || response.StatusCode >= 300 {
		_, _ = io.Copy(io.Discard, io.LimitReader(response.Body, 4096))
		return fmt.Errorf("Telegram returned HTTP %d", response.StatusCode)
	}
	var result telegramAPIResponse
	if err := json.NewDecoder(io.LimitReader(response.Body, 4096)).Decode(&result); err != nil || !result.OK {
		return fmt.Errorf("Telegram rejected the message")
	}
	return nil
}

func notificationMessages(payload AlertmanagerWebhook) []string {
	var messages []string
	for _, item := range payload.Alerts {
		status := item.Status
		if status == "" {
			status = payload.Status
		}
		title := "СРАБОТАЛО"
		if status == "resolved" {
			title = "ВОССТАНОВЛЕНО"
		}
		name := item.Labels["alertname"]
		localizedNames := map[string]string{
			"SiteDown":             "Сайт недоступен",
			"MySQLDown":            "MySQL недоступен",
			"MonitoringTargetDown": "Цель мониторинга недоступна",
			"ContainerDown":        "Контейнер остановлен",
			"ContainerRestarting":  "Контейнер перезапускается",
		}
		if localized, ok := localizedNames[name]; ok {
			name = localized
		}
		if name == "" {
			name = "Оповещение"
		}
		lines := []string{fmt.Sprintf("[%s] %s", title, name)}
		if severity := item.Labels["severity"]; severity != "" {
			localizedSeverity := map[string]string{
				"critical": "Критическая",
				"warning":  "Предупреждение",
				"info":     "Информация",
			}
			if localized, ok := localizedSeverity[severity]; ok {
				severity = localized
			}
			lines = append(lines, "Важность: "+severity)
		}
		var object []string
		labelNames := map[string]string{
			"namespace":   "Пространство",
			"pod":         "Под",
			"container":   "Контейнер",
			"deployment":  "Развёртывание",
			"statefulset": "Набор состояния",
			"instance":    "Экземпляр",
			"job":         "Задача",
		}
		for _, key := range []string{"namespace", "pod", "container", "deployment", "statefulset", "instance", "job"} {
			if value := item.Labels[key]; value != "" {
				object = append(object, labelNames[key]+"="+value)
			}
		}
		if len(object) > 0 {
			lines = append(lines, strings.Join(object, " | "))
		}
		summary := item.Annotations["summary"]
		if summary != "" {
			lines = append(lines, summary)
		}
		if description := item.Annotations["description"]; description != "" && description != summary {
			lines = append(lines, description)
		}
		text := []rune(strings.Join(lines, "\n"))
		for len(text) > 2000 {
			messages = append(messages, string(text[:2000]))
			text = text[2000:]
		}
		if len(text) > 0 {
			messages = append(messages, string(text))
		}
	}
	return messages
}

func webhookHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Only POST allowed", http.StatusMethodNotAllowed)
		return
	}
	r.Body = http.MaxBytesReader(w, r.Body, 1024*1024)
	var payload AlertmanagerWebhook
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil || len(payload.Alerts) == 0 {
		http.Error(w, "Invalid alert payload", http.StatusBadRequest)
		return
	}
	for _, message := range notificationMessages(payload) {
		if err := sendNotification(message); err != nil {
			log.Print("Telegram alert delivery failed")
			http.Error(w, "Notification delivery failed", http.StatusBadGateway)
			return
		}
	}
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte("OK"))
}
