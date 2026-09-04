package main

import (
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

type AlertmanagerWebhook struct {
	Status string `json:"status"`
	Alerts []struct {
		Labels      map[string]string `json:"labels"`
		Annotations map[string]string `json:"annotations"`
	} `json:"alerts"`
}

func webhookHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Only POST allowed", http.StatusMethodNotAllowed)
		return
	}

	var alertData AlertmanagerWebhook
	if err := json.NewDecoder(r.Body).Decode(&alertData); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	var message string
	if len(alertData.Alerts) > 0 {
		summary := alertData.Alerts[0].Annotations["summary"]
		if summary == "" {
			summary = alertData.Alerts[0].Annotations["description"]
		}
		if summary != "" {
			message = summary
		}
	}

	if message != "" {
		_, err := vk.MessagesSend(api.Params{
			"peer_id":   peerID,
			"message":   message,
			"random_id": 0,
		})
		if err != nil {
			log.Printf("Ошибка отправки в VK: %v", err)
		}
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte("OK"))
}



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
		"peer_id":   peerID,
		"message":   "Бот запущен!",
		"random_id": 0,
	})
	if err != nil {
		log.Printf("Проблема отправки сообщения: %v", err)
	}
	log.Println("Go")


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