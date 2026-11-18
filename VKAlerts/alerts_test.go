package main

import (
	"errors"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestAllAlertsAndIndividualStatus(t *testing.T) {
	messages := notificationMessages(AlertmanagerWebhook{Status: "firing", Alerts: []alert{
		{Status: "firing", Labels: map[string]string{"alertname": "SiteDown", "instance": "site"}, Annotations: map[string]string{"summary": "Unavailable", "description": "Probe failed"}},
		{Status: "resolved", Labels: map[string]string{"alertname": "MySQLDown"}},
	}})
	if len(messages) != 2 || !strings.Contains(messages[0], "[FIRING] SiteDown") || !strings.Contains(messages[0], "instance=site") || !strings.Contains(messages[0], "Probe failed") || !strings.Contains(messages[1], "[RESOLVED] MySQLDown") {
		t.Fatalf("Unexpected messages: %v", messages)
	}
}
func TestMessageLimitPreservesText(t *testing.T) {
	messages := notificationMessages(AlertmanagerWebhook{Alerts: []alert{{Annotations: map[string]string{"summary": strings.Repeat("\u044f", 8000)}}}})
	var combined string
	for _, m := range messages {
		if len([]rune(m)) > 3500 {
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
