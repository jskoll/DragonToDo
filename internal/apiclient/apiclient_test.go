package apiclient

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

func TestLoginStoresTokens(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != loginPath || r.Method != http.MethodPost {
			t.Fatalf("unexpected request: %s %s", r.Method, r.URL.Path)
		}
		var body map[string]string
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			t.Fatal(err)
		}
		if body["email"] != "alice@example.com" || body["password"] != "hunter2" {
			t.Fatalf("unexpected login body: %+v", body)
		}
		writeJSON(t, w, http.StatusOK, tokenPairResponse{Token: "access-1", RefreshToken: "refresh-1"})
	}))
	defer server.Close()

	client := New(server.URL, server.Client())
	if err := client.Login(context.Background(), "alice@example.com", "hunter2"); err != nil {
		t.Fatalf("Login() error = %v", err)
	}

	if client.accessToken != "access-1" || client.refreshToken != "refresh-1" {
		t.Fatalf("tokens not stored: access=%q refresh=%q", client.accessToken, client.refreshToken)
	}
}

func TestLoginWithWrongPasswordReturnsAPIError(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		writeJSON(t, w, http.StatusUnauthorized, map[string]string{"title": "Unauthorized", "detail": "Invalid credentials."})
	}))
	defer server.Close()

	client := New(server.URL, server.Client())
	err := client.Login(context.Background(), "alice@example.com", "wrong")
	if err == nil {
		t.Fatal("expected an error")
	}

	var apiErr *APIError
	if !asAPIError(err, &apiErr) {
		t.Fatalf("expected *APIError, got %T: %v", err, err)
	}
	if apiErr.StatusCode != http.StatusUnauthorized {
		t.Fatalf("StatusCode = %d, want 401", apiErr.StatusCode)
	}
}

func TestDoRefreshesAccessTokenOnceOn401(t *testing.T) {
	var taskRequests int
	var refreshRequests int

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.URL.Path == refreshTokenPath:
			refreshRequests++
			writeJSON(t, w, http.StatusOK, tokenPairResponse{Token: "access-2", RefreshToken: "refresh-2"})
		case r.URL.Path == tasksPath && r.Method == http.MethodGet:
			taskRequests++
			if r.Header.Get("Authorization") == "Bearer access-1" {
				w.WriteHeader(http.StatusUnauthorized)

				return
			}
			if r.Header.Get("Authorization") != "Bearer access-2" {
				t.Fatalf("unexpected Authorization header: %s", r.Header.Get("Authorization"))
			}
			writeJSON(t, w, http.StatusOK, taskCollectionResponse{Member: []Task{{ID: 1, Description: "hi"}}})
		default:
			t.Fatalf("unexpected request: %s %s", r.Method, r.URL.Path)
		}
	}))
	defer server.Close()

	client := New(server.URL, server.Client())
	client.accessToken = "access-1"
	client.refreshToken = "refresh-1"

	tasks, err := client.ListTasks(context.Background())
	if err != nil {
		t.Fatalf("ListTasks() error = %v", err)
	}
	if len(tasks) != 1 || tasks[0].Description != "hi" {
		t.Fatalf("unexpected tasks: %+v", tasks)
	}
	if taskRequests != 2 {
		t.Fatalf("expected 2 requests to /api/tasks (initial + retry), got %d", taskRequests)
	}
	if refreshRequests != 1 {
		t.Fatalf("expected exactly 1 refresh request, got %d", refreshRequests)
	}
}

func TestCreateAndUpdateTask(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.Method == http.MethodPost && r.URL.Path == tasksPath:
			if ct := r.Header.Get("Content-Type"); ct != mimeJSONLD {
				t.Fatalf("Content-Type = %q, want %q", ct, mimeJSONLD)
			}
			var input TaskInput
			if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
				t.Fatal(err)
			}
			if input.Description == nil || *input.Description != "Write the report" {
				t.Fatalf("unexpected input: %+v", input)
			}
			writeJSON(t, w, http.StatusCreated, Task{
				IRI: "/api/tasks/1", ID: 1, Description: "Write the report",
				Projects: []string{}, Contexts: []string{}, Extensions: extensions{},
			})
		case r.Method == http.MethodPatch && r.URL.Path == taskPath(1):
			if ct := r.Header.Get("Content-Type"); ct != mimeMergePatch {
				t.Fatalf("Content-Type = %q, want %q", ct, mimeMergePatch)
			}
			var input TaskInput
			if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
				t.Fatal(err)
			}
			if input.Done == nil || !*input.Done {
				t.Fatalf("unexpected patch input: %+v", input)
			}
			writeJSON(t, w, http.StatusOK, Task{
				IRI: "/api/tasks/1", ID: 1, Description: "Write the report", Done: true,
				Projects: []string{}, Contexts: []string{}, Extensions: extensions{},
			})
		default:
			t.Fatalf("unexpected request: %s %s", r.Method, r.URL.Path)
		}
	}))
	defer server.Close()

	client := New(server.URL, server.Client())
	client.accessToken = "access-1"

	desc := "Write the report"
	created, err := client.CreateTask(context.Background(), TaskInput{Description: &desc})
	if err != nil {
		t.Fatalf("CreateTask() error = %v", err)
	}
	if created.ID != 1 || created.Description != desc {
		t.Fatalf("unexpected created task: %+v", created)
	}

	done := true
	updated, err := client.UpdateTask(context.Background(), 1, TaskInput{Done: &done})
	if err != nil {
		t.Fatalf("UpdateTask() error = %v", err)
	}
	if !updated.Done {
		t.Fatalf("expected updated task to be done: %+v", updated)
	}
}

func TestDeleteTask(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodDelete || r.URL.Path != taskPath(1) {
			t.Fatalf("unexpected request: %s %s", r.Method, r.URL.Path)
		}
		w.WriteHeader(http.StatusNoContent)
	}))
	defer server.Close()

	client := New(server.URL, server.Client())
	client.accessToken = "access-1"

	if err := client.DeleteTask(context.Background(), 1); err != nil {
		t.Fatalf("DeleteTask() error = %v", err)
	}
}

func TestDeleteTaskOnAnotherUsersTaskReturns404(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		writeJSON(t, w, http.StatusNotFound, map[string]string{"title": "An error occurred", "detail": "Not Found"})
	}))
	defer server.Close()

	client := New(server.URL, server.Client())
	client.accessToken = "access-1"

	err := client.DeleteTask(context.Background(), 999)
	var apiErr *APIError
	if !asAPIError(err, &apiErr) || apiErr.StatusCode != http.StatusNotFound {
		t.Fatalf("expected a 404 *APIError, got %v", err)
	}
}

// extensions.UnmarshalJSON must accept the `[]` an empty PHP array serializes as,
// not just `{}` — see backend/src/Entity/Task.php's syncExtensions() comment.
func TestExtensionsAcceptsEmptyArrayForm(t *testing.T) {
	var e extensions
	if err := json.Unmarshal([]byte(`[]`), &e); err != nil {
		t.Fatalf("unmarshal `[]`: %v", err)
	}
	if len(e) != 0 {
		t.Fatalf("expected empty map, got %+v", e)
	}

	if err := json.Unmarshal([]byte(`{"due":"2026-09-01"}`), &e); err != nil {
		t.Fatalf("unmarshal object form: %v", err)
	}
	if e["due"] != "2026-09-01" {
		t.Fatalf("unexpected extensions: %+v", e)
	}
}

func TestFlexDateRoundTrip(t *testing.T) {
	d := newFlexDate(time.Date(2026, 9, 1, 0, 0, 0, 0, time.UTC))

	data, err := json.Marshal(d)
	if err != nil {
		t.Fatalf("Marshal() error = %v", err)
	}
	if string(data) != `"2026-09-01"` {
		t.Fatalf("Marshal() = %s, want \"2026-09-01\"", data)
	}

	var fromAPI flexDate
	if err := json.Unmarshal([]byte(`"2026-09-01T00:00:00+00:00"`), &fromAPI); err != nil {
		t.Fatalf("Unmarshal(RFC3339) error = %v", err)
	}
	tm, ok := fromAPI.Time()
	if !ok || !tm.Equal(time.Date(2026, 9, 1, 0, 0, 0, 0, time.UTC)) {
		t.Fatalf("unexpected time: %v (ok=%v)", tm, ok)
	}

	var empty flexDate
	if err := json.Unmarshal([]byte(`null`), &empty); err != nil {
		t.Fatalf("Unmarshal(null) error = %v", err)
	}
	if _, ok := empty.Time(); ok {
		t.Fatal("expected no time set after unmarshaling null")
	}
}

func writeJSON(t *testing.T, w http.ResponseWriter, status int, v any) {
	t.Helper()
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(v); err != nil {
		t.Fatal(err)
	}
}

func asAPIError(err error, target **APIError) bool {
	apiErr, ok := err.(*APIError)
	if ok {
		*target = apiErr
	}

	return ok
}
