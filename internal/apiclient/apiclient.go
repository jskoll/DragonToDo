// Package apiclient is a minimal HTTP client for the dragon-todo backend API
// (backend/, a Symfony/API Platform service). It is a starting point for a future
// API-backed TUI/CLI client: it is not wired into cmd/ or internal/tui/ yet, which
// still read/write todo.txt files directly.
//
// The backend speaks JSON-LD (Content-Type/Accept: application/ld+json); item
// resources are identified by an IRI like "/api/tasks/42" rather than a bare id.
package apiclient

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"sync"
	"time"
)

const (
	mimeJSONLD       = "application/ld+json"
	mimeMergePatch   = "application/merge-patch+json"
	mimeJSON         = "application/json"
	loginPath        = "/api/login"
	registerPath     = "/api/register"
	refreshTokenPath = "/api/token/refresh"
)

// Client is a small, stateful HTTP client for the dragon-todo API: it holds the
// current access/refresh token pair and transparently refreshes the access token
// once on a 401 before retrying a request.
type Client struct {
	baseURL    string
	httpClient *http.Client

	mu           sync.Mutex
	accessToken  string
	refreshToken string
}

// New creates a Client for the API rooted at baseURL (e.g. "https://api.example.com",
// no trailing slash). If httpClient is nil, http.DefaultClient is used.
func New(baseURL string, httpClient *http.Client) *Client {
	if httpClient == nil {
		httpClient = http.DefaultClient
	}

	return &Client{
		baseURL:    strings.TrimRight(baseURL, "/"),
		httpClient: httpClient,
	}
}

// APIError represents an RFC 7807 problem+json error response from the API.
type APIError struct {
	StatusCode int
	Title      string `json:"title"`
	Detail     string `json:"detail"`
}

func (e *APIError) Error() string {
	if e.Detail != "" {
		return fmt.Sprintf("apiclient: %d %s: %s", e.StatusCode, e.Title, e.Detail)
	}

	return fmt.Sprintf("apiclient: %d %s", e.StatusCode, e.Title)
}

type tokenPairResponse struct {
	Token        string `json:"token"`
	RefreshToken string `json:"refresh_token"`
}

// Login authenticates with email/password and stores the resulting access and
// refresh tokens on the Client for subsequent requests.
func (c *Client) Login(ctx context.Context, email, password string) error {
	body, err := json.Marshal(map[string]string{"email": email, "password": password})
	if err != nil {
		return fmt.Errorf("apiclient: encoding login request: %w", err)
	}

	tokens, err := c.requestTokens(ctx, loginPath, body, mimeJSON)
	if err != nil {
		return err
	}

	c.mu.Lock()
	c.accessToken = tokens.Token
	c.refreshToken = tokens.RefreshToken
	c.mu.Unlock()

	return nil
}

// Register creates a new account. It does not log the new user in; call Login
// afterwards.
func (c *Client) Register(ctx context.Context, email, password string) error {
	body, err := json.Marshal(map[string]string{"email": email, "password": password})
	if err != nil {
		return fmt.Errorf("apiclient: encoding register request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+registerPath, bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("apiclient: building register request: %w", err)
	}
	req.Header.Set("Content-Type", mimeJSON)
	req.Header.Set("Accept", mimeJSON)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("apiclient: register request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated {
		return decodeAPIError(resp)
	}

	return nil
}

// refresh exchanges the stored refresh token for a new access/refresh token pair.
// Refresh tokens are single-use (rotated on every refresh by the backend), so the
// old refresh token stops working the moment this succeeds.
func (c *Client) refresh(ctx context.Context) error {
	c.mu.Lock()
	refreshToken := c.refreshToken
	c.mu.Unlock()

	if refreshToken == "" {
		return errors.New("apiclient: no refresh token available; call Login first")
	}

	body, err := json.Marshal(map[string]string{"refresh_token": refreshToken})
	if err != nil {
		return fmt.Errorf("apiclient: encoding refresh request: %w", err)
	}

	tokens, err := c.requestTokens(ctx, refreshTokenPath, body, mimeJSON)
	if err != nil {
		return err
	}

	c.mu.Lock()
	c.accessToken = tokens.Token
	c.refreshToken = tokens.RefreshToken
	c.mu.Unlock()

	return nil
}

func (c *Client) requestTokens(ctx context.Context, path string, body []byte, contentType string) (*tokenPairResponse, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+path, bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("apiclient: building request for %s: %w", path, err)
	}
	req.Header.Set("Content-Type", contentType)
	req.Header.Set("Accept", mimeJSON)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("apiclient: request to %s: %w", path, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, decodeAPIError(resp)
	}

	var tokens tokenPairResponse
	if err := json.NewDecoder(resp.Body).Decode(&tokens); err != nil {
		return nil, fmt.Errorf("apiclient: decoding response from %s: %w", path, err)
	}

	return &tokens, nil
}

// do performs an authenticated request, retrying exactly once via refresh() if the
// first attempt comes back 401 Unauthorized (the access token has expired).
func (c *Client) do(ctx context.Context, method, path string, body []byte, contentType string) (*http.Response, error) {
	resp, err := c.doOnce(ctx, method, path, body, contentType)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode != http.StatusUnauthorized {
		return resp, nil
	}
	resp.Body.Close()

	if err := c.refresh(ctx); err != nil {
		return nil, fmt.Errorf("apiclient: refreshing access token after 401: %w", err)
	}

	return c.doOnce(ctx, method, path, body, contentType)
}

func (c *Client) doOnce(ctx context.Context, method, path string, body []byte, contentType string) (*http.Response, error) {
	var reader io.Reader
	if body != nil {
		reader = bytes.NewReader(body)
	}

	req, err := http.NewRequestWithContext(ctx, method, c.baseURL+path, reader)
	if err != nil {
		return nil, fmt.Errorf("apiclient: building %s %s: %w", method, path, err)
	}
	if body != nil {
		req.Header.Set("Content-Type", contentType)
	}
	req.Header.Set("Accept", mimeJSONLD)

	c.mu.Lock()
	token := c.accessToken
	c.mu.Unlock()
	if token == "" {
		return nil, errors.New("apiclient: not authenticated; call Login first")
	}
	req.Header.Set("Authorization", "Bearer "+token)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("apiclient: %s %s: %w", method, path, err)
	}

	return resp, nil
}

func decodeAPIError(resp *http.Response) error {
	apiErr := &APIError{StatusCode: resp.StatusCode}
	_ = json.NewDecoder(resp.Body).Decode(apiErr)
	if apiErr.Title == "" {
		apiErr.Title = http.StatusText(resp.StatusCode)
	}

	return apiErr
}

// flexDate marshals as "2006-01-02" (what the API accepts for date fields on
// write) and unmarshals either that format or a full RFC3339 timestamp (what the
// API returns for date fields, e.g. "2026-09-01T00:00:00+00:00").
type flexDate struct {
	t     time.Time
	valid bool
}

func newFlexDate(t time.Time) flexDate {
	return flexDate{t: t, valid: true}
}

// Time returns the underlying time and whether a value was set.
func (d flexDate) Time() (time.Time, bool) {
	return d.t, d.valid
}

func (d flexDate) MarshalJSON() ([]byte, error) {
	if !d.valid {
		return []byte("null"), nil
	}

	return json.Marshal(d.t.Format("2006-01-02"))
}

func (d *flexDate) UnmarshalJSON(data []byte) error {
	if string(data) == "null" {
		*d = flexDate{}

		return nil
	}

	var s string
	if err := json.Unmarshal(data, &s); err != nil {
		return err
	}

	for _, layout := range []string{time.RFC3339, "2006-01-02"} {
		if t, err := time.Parse(layout, s); err == nil {
			*d = newFlexDate(t)

			return nil
		}
	}

	return fmt.Errorf("apiclient: unrecognized date format %q", s)
}
