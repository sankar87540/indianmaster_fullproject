package services

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"
)

// ExpoPushService sends push notifications via the Expo Push API.
// No Firebase Admin SDK is required — Expo's server handles FCM and APNs routing.
type ExpoPushService struct {
	client *http.Client
}

// NewExpoPushService creates a new ExpoPushService.
func NewExpoPushService() *ExpoPushService {
	return &ExpoPushService{
		client: &http.Client{Timeout: 10 * time.Second},
	}
}

type expoPushMessage struct {
	To    string `json:"to"`
	Title string `json:"title"`
	Body  string `json:"body"`
	Sound string `json:"sound"`
}

type expoPushResponse struct {
	Data []struct {
		Status  string `json:"status"`
		Message string `json:"message,omitempty"`
	} `json:"data"`
}

// Send delivers a single push notification to an Expo push token.
// Silently no-ops if token is empty or not an Expo token.
func (s *ExpoPushService) Send(ctx context.Context, expoPushToken, title, body string) error {
	if expoPushToken == "" {
		return nil
	}
	// Only send to valid Expo push tokens (ExponentPushToken[...])
	if !strings.HasPrefix(expoPushToken, "ExponentPushToken") {
		return nil
	}

	msg := expoPushMessage{
		To:    expoPushToken,
		Title: title,
		Body:  body,
		Sound: "default",
	}

	payload, err := json.Marshal([]expoPushMessage{msg})
	if err != nil {
		return fmt.Errorf("push: marshal failed: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST",
		"https://exp.host/--/api/v2/push/send",
		bytes.NewReader(payload),
	)
	if err != nil {
		return fmt.Errorf("push: build request failed: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")
	req.Header.Set("Accept-Encoding", "gzip, deflate")

	resp, err := s.client.Do(req)
	if err != nil {
		return fmt.Errorf("push: HTTP request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return fmt.Errorf("push: Expo API returned %d", resp.StatusCode)
	}

	var pushResp expoPushResponse
	if err := json.NewDecoder(resp.Body).Decode(&pushResp); err == nil {
		for _, d := range pushResp.Data {
			if d.Status == "error" {
				log.Printf("[push] Expo delivery error for token %s: %s", expoPushToken, d.Message)
			}
		}
	}

	return nil
}
