package main

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestAllAlertsAndIndividualStatus(t *testing.T) {
	messages := notificationMessages(AlertmanagerWebhook{Status: "firing", Alerts: []alert{
		{Status: "firing", Labels: map[string]string{"alertname": "SiteDown", "instance": "site", "severity": "critical"}, Annotations: map[string]string{"summary": "Сайт недоступен", "description": "Проверка не пройдена"}},
		{Status: "resolved", Labels: map[string]string{"alertname": "MySQLDown"}},
	}})
	if len(messages) != 2 || !strings.Contains(messages[0], "[СРАБОТАЛО] Сайт недоступен") || !strings.Contains(messages[0], "Экземпляр=site") || !strings.Contains(messages[0], "Проверка не пройдена") || !strings.Contains(messages[0], "Важность: Критическая") || !strings.Contains(messages[1], "[ВОССТАНОВЛЕНО] MySQL недоступен") {
		t.Fatalf("Unexpected messages: %v", messages)
	}
}
func TestMessageLimitPreservesText(t *testing.T) {
	messages := notificationMessages(AlertmanagerWebhook{Alerts: []alert{{Annotations: map[string]string{"summary": strings.Repeat("\u044f", 8000)}}}})
	var combined string
	for _, m := range messages {
		if len([]rune(m)) > 2000 {
			t.Fatal("Message too long")
		}
		combined += m
	}
	if strings.Count(combined, "\u044f") != 8000 {
		t.Fatal("Text lost during splitting")
	}
}
func TestWebhookRetriesOnDeliveryFailure(t *testing.T) {
	old := sendNotification
	defer func() { sendNotification = old }()
	sendNotification = func(string) error { return errors.New("offline") }
	w := httptest.NewRecorder()
	webhookHandler(w, httptest.NewRequest("POST", "/webhook", strings.NewReader(`{"status":"firing","alerts":[{"labels":{"alertname":"Test"}}]}`)))
	if w.Code != 502 {
		t.Fatalf("Status %d", w.Code)
	}
}
func TestWebhookValidationAndAllDeliveries(t *testing.T) {
	old := sendNotification
	defer func() { sendNotification = old }()
	sent := 0
	sendNotification = func(string) error { sent++; return nil }
	for _, tc := range []struct {
		method, body string
		code         int
	}{{"GET", "", 405}, {"POST", "invalid", 400}, {"POST", `{"alerts":[]}`, 400}, {"POST", `{"alerts":[{"labels":{"alertname":"One"}},{"status":"resolved","labels":{"alertname":"Two"}}]}`, 200}} {
		w := httptest.NewRecorder()
		webhookHandler(w, httptest.NewRequest(tc.method, "/webhook", strings.NewReader(tc.body)))
		if w.Code != tc.code {
			t.Fatalf("Got %d, want %d", w.Code, tc.code)
		}
	}
	if sent != 2 {
		t.Fatalf("Sent %d messages", sent)
	}
}

func TestTelegramSendMessageUsesBotAPI(t *testing.T) {
	oldBase, oldToken, oldChat, oldClient := telegramAPIBase, telegramToken, telegramChatID, httpClient
	defer func() {
		telegramAPIBase, telegramToken, telegramChatID, httpClient = oldBase, oldToken, oldChat, oldClient
	}()

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost || r.URL.Path != "/bot123456:test-token/sendMessage" {
			t.Errorf("unexpected Telegram API request: %s %s", r.Method, r.URL.Path)
		}
		if got := r.Header.Get("Content-Type"); got != "application/json" {
			t.Errorf("Content-Type = %q", got)
		}
		var payload telegramMessageRequest
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			t.Errorf("decode request: %v", err)
		}
		if payload.ChatID != "-1001234567890" || payload.Text != "hello" {
			t.Errorf("unexpected payload: %#v", payload)
		}
		_, _ = w.Write([]byte(`{"ok":true}`))
	}))
	defer server.Close()

	telegramAPIBase = server.URL
	telegramToken = "123456:test-token"
	telegramChatID = "-1001234567890"
	httpClient = server.Client()
	if err := sendTelegramMessage("hello"); err != nil {
		t.Fatalf("sendTelegramMessage: %v", err)
	}
}

func TestTelegramAPIRejectionDoesNotExposeToken(t *testing.T) {
	oldBase, oldToken, oldChat, oldClient := telegramAPIBase, telegramToken, telegramChatID, httpClient
	defer func() {
		telegramAPIBase, telegramToken, telegramChatID, httpClient = oldBase, oldToken, oldChat, oldClient
	}()

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		_, _ = w.Write([]byte(`{"ok":false,"description":"rejected"}`))
	}))
	defer server.Close()
	telegramAPIBase = server.URL
	telegramToken = "123456:test-token"
	telegramChatID = "42"
	httpClient = server.Client()
	err := sendTelegramMessage("hello")
	if err == nil || strings.Contains(err.Error(), telegramToken) {
		t.Fatalf("expected redacted API rejection, got %v", err)
	}
}
