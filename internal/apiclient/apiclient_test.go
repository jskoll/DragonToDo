package apiclient

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"sync"
	"sync/atomic"
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

// ListTasks must walk every page (API Platform's default pagination caps a single
// response at 30 items), aggregating `member` across pages rather than silently
// returning only the first page.
func TestListTasksWalksPagination(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			t.Fatalf("unexpected method: %s", r.Method)
		}
		switch r.URL.RawQuery {
		case "":
			writeJSON(t, w, http.StatusOK, taskCollectionResponse{
				Member: []Task{{ID: 1, Description: "first"}, {ID: 2, Description: "second"}},
				View: &struct {
					Next string `json:"next"`
				}{Next: tasksPath + "?page=2"},
			})
		case "page=2":
			writeJSON(t, w, http.StatusOK, taskCollectionResponse{
				Member: []Task{{ID: 3, Description: "third"}},
			})
		default:
			t.Fatalf("unexpected query: %s", r.URL.RawQuery)
		}
	}))
	defer server.Close()

	client := New(server.URL, server.Client())
	client.accessToken = "access-1"

	tasks, err := client.ListTasks(context.Background())
	if err != nil {
		t.Fatalf("ListTasks() error = %v", err)
	}
	if len(tasks) != 3 {
		t.Fatalf("expected 3 tasks across 2 pages, got %d: %+v", len(tasks), tasks)
	}
	for i, wantID := range []int{1, 2, 3} {
		if tasks[i].ID != wantID {
			t.Fatalf("tasks[%d].ID = %d, want %d", i, tasks[i].ID, wantID)
		}
	}
}

// Two goroutines hitting a 401 at (nearly) the same moment must coalesce into a single
// refresh call: the server here accepts exactly one refresh (matching the real API's
// single-use rotation) and 401s any second attempt, so a naive implementation that lets
// both goroutines call refresh() independently would leave one of them permanently
// unauthenticated even though the client, as a whole, is fine.
func TestConcurrentRefreshCoalescesIntoOneCall(t *testing.T) {
	var refreshCount int32
	var currentAccessToken atomic.Value
	// The server only ever accepts "access-2": the client starting on "access-1"
	// simulates every goroutine's first request racing against an already-expired
	// access token, so every one of them hits a 401 before any refresh has happened.
	currentAccessToken.Store("access-2")

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.URL.Path == refreshTokenPath:
			if atomic.AddInt32(&refreshCount, 1) > 1 {
				w.WriteHeader(http.StatusUnauthorized)

				return
			}
			currentAccessToken.Store("access-2")
			writeJSON(t, w, http.StatusOK, tokenPairResponse{Token: "access-2", RefreshToken: "refresh-2"})
		case r.URL.Path == tasksPath:
			if r.Header.Get("Authorization") != "Bearer "+currentAccessToken.Load().(string) {
				w.WriteHeader(http.StatusUnauthorized)

				return
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

	const goroutines = 5
	var wg sync.WaitGroup
	errs := make([]error, goroutines)
	for i := range goroutines {
		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			_, errs[i] = client.ListTasks(context.Background())
		}(i)
	}
	wg.Wait()

	for i, err := range errs {
		if err != nil {
			t.Errorf("goroutine %d: ListTasks() error = %v", i, err)
		}
	}
	if got := atomic.LoadInt32(&refreshCount); got != 1 {
		t.Fatalf("expected exactly 1 refresh call, got %d", got)
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

// A nil TaskInput.DueDate must be omitted (PATCH leaves it unchanged), while
// NullClear() must send an explicit JSON null (PATCH clears it) — a plain *string
// can't distinguish these two cases once marshaled with `omitempty`.
func TestNullClearSendsExplicitJSONNull(t *testing.T) {
	unset, err := json.Marshal(TaskInput{})
	if err != nil {
		t.Fatalf("Marshal(unset) error = %v", err)
	}
	if string(unset) != "{}" {
		t.Fatalf("Marshal(unset) = %s, want {}", unset)
	}

	cleared, err := json.Marshal(TaskInput{DueDate: NullClear()})
	if err != nil {
		t.Fatalf("Marshal(cleared) error = %v", err)
	}
	if string(cleared) != `{"dueDate":null}` {
		t.Fatalf("Marshal(cleared) = %s, want {\"dueDate\":null}", cleared)
	}

	set, err := json.Marshal(TaskInput{DueDate: NullSet("2026-09-01")})
	if err != nil {
		t.Fatalf("Marshal(set) error = %v", err)
	}
	if string(set) != `{"dueDate":"2026-09-01"}` {
		t.Fatalf("Marshal(set) = %s, want {\"dueDate\":\"2026-09-01\"}", set)
	}
}

// A PATCH clearing dueDate must actually reach the server as JSON null in the request
// body, not be dropped or sent as an empty string.
func TestUpdateTaskSendsNullToClearADateField(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var raw map[string]json.RawMessage
		if err := json.NewDecoder(r.Body).Decode(&raw); err != nil {
			t.Fatal(err)
		}
		dueDate, ok := raw["dueDate"]
		if !ok {
			t.Fatalf("expected dueDate in patch body, got %+v", raw)
		}
		if string(dueDate) != "null" {
			t.Fatalf("dueDate = %s, want null", dueDate)
		}

		writeJSON(t, w, http.StatusOK, Task{
			IRI: "/api/tasks/1", ID: 1, Description: "No longer due",
			Projects: []string{}, Contexts: []string{}, Extensions: extensions{},
		})
	}))
	defer server.Close()

	client := New(server.URL, server.Client())
	client.accessToken = "access-1"

	updated, err := client.UpdateTask(context.Background(), 1, TaskInput{DueDate: NullClear()})
	if err != nil {
		t.Fatalf("UpdateTask() error = %v", err)
	}
	if tm, ok := updated.DueDate.Time(); ok {
		t.Fatalf("expected DueDate to be cleared, got %v", tm)
	}
}

// RegistrationController returns {"error": "...", "violations": {...}}, not RFC 7807's
// title/detail — Register() must still surface the message.
func TestRegisterDecodesCustomErrorShape(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		writeJSON(t, w, http.StatusConflict, map[string]string{
			"error": "An account with this email already exists.",
		})
	}))
	defer server.Close()

	client := New(server.URL, server.Client())
	err := client.Register(context.Background(), "dupe@example.com", "correct-horse-battery-staple")

	var apiErr *APIError
	if !asAPIError(err, &apiErr) {
		t.Fatalf("expected *APIError, got %T: %v", err, err)
	}
	if apiErr.StatusCode != http.StatusConflict {
		t.Fatalf("StatusCode = %d, want 409", apiErr.StatusCode)
	}
	if apiErr.Detail != "An account with this email already exists." {
		t.Fatalf("Detail = %q, want the server's error message", apiErr.Detail)
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
