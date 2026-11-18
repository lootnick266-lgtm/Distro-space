package main

import (
        "strings"
        "fmt"
        "encoding/json"
	"log"
	"net/http"
	"os"
	"strconv"

	"github.com/SevereCloud/vksdk/v3/api"
)

// web hook
var (
	vk      *api.VK
	peerID int
)

// ==================== Bot startup ====================

func main() {
	var err error

		//token
	token := os.Getenv("VKTOKEN")
	vk = api.NewVK(token)


	//user
	peerIDSTR := os.Getenv("LOCAL_USER")
	peerID, err = strconv.Atoi(peerIDSTR)
	if err != nil {
		log.Fatal("Проблема загрузки юзера")
	}
        _, err = vk.MessagesSend(api.Params{
                "peer_id": peerID,
                "message": "Бот запущен!",
                "random_id": 0,
        })
        if err != nil {
                log.Print("Startup notification delivery failed")
        }
        log.Println("Bot server starting")


	http.HandleFunc("/webhook", webhookHandler)
		if err := http.ListenAndServe(":8080", nil); err != nil {
			log.Printf("Ошибка запуска сервера: %v", err)
		}


		//бесконечный цикл бота
//	err = lp.Run()
//	if err != nil {
//		panic(err)
//	}
}

// ==================== Webhook data ====================

type alert struct {
	Status      string            `json:"status"`
	Labels      map[string]string `json:"labels"`
	Annotations map[string]string `json:"annotations"`
}
type AlertmanagerWebhook struct {
	Status string  `json:"status"`
	Alerts []alert `json:"alerts"`
}

// ==================== Notification delivery ====================

// Injectable transport keeps formatter and HTTP tests offline.
var sendNotification = func(message string) error {
	_, err := vk.MessagesSend(api.Params{"peer_id": peerID, "message": message, "random_id": 0})
	return err
}

// ==================== Message formatting ====================

func notificationMessages(payload AlertmanagerWebhook) []string {
	var messages []string
	for _, item := range payload.Alerts {
		status := item.Status
		if status == "" {
			status = payload.Status
		}
		title := "FIRING"
		if status == "resolved" {
			title = "RESOLVED"
		}
		name := item.Labels["alertname"]
		if name == "" {
			name = "Alert"
		}
		lines := []string{fmt.Sprintf("[%s] %s", title, name)}
		if severity := item.Labels["severity"]; severity != "" {
			lines = append(lines, "Severity: "+severity)
		}
		var object []string
		for _, key := range []string{"namespace", "pod", "container", "deployment", "statefulset", "instance", "job"} {
			if value := item.Labels[key]; value != "" {
				object = append(object, key+"="+value)
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
		for len(text) > 3500 {
			messages = append(messages, string(text[:3500]))
			text = text[3500:]
		}
		if len(text) > 0 {
			messages = append(messages, string(text))
		}
	}
	return messages
}

// ==================== HTTP handler ====================

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
			// Do not log SDK errors: they can contain request details.
			log.Print("VK alert delivery failed")
			http.Error(w, "Notification delivery failed", http.StatusBadGateway)
			return
		}
	}
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte("OK"))
}
