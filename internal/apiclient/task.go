package apiclient

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
)

const tasksPath = "/api/tasks"

// extensions is a string->string map that also accepts a JSON `[]` on the wire:
// Symfony's serializer emits an empty PHP array as `[]` rather than `{}`, and the
// API's extensions field is always empty from the client's point of view since it's
// read-only (derived server-side from dueDate, see backend/src/Entity/Task.php).
type extensions map[string]string

func (e *extensions) UnmarshalJSON(data []byte) error {
	trimmed := strings.TrimSpace(string(data))
	if trimmed == "[]" || trimmed == "null" {
		*e = extensions{}

		return nil
	}

	var m map[string]string
	if err := json.Unmarshal(data, &m); err != nil {
		return err
	}
	*e = m

	return nil
}

// NullableString distinguishes, for a PATCH request, "leave this field unchanged"
// (omit it), "clear this field" (send JSON null), and "set this field" (send a value)
// — a plain *string can only express the first and third, since a nil pointer looks
// the same either way once marshaled with `omitempty`.
//
// Used via a *NullableString field on TaskInput: the outer pointer's nilness controls
// omission (encoding/json's `omitempty` only omits a nil pointer, never a struct value,
// which is why the field has to be a pointer at all), and the inner Value's nilness
// controls null-vs-value. Build one with NullClear() or NullSet(...), never a bare
// &NullableString{...} literal.
type NullableString struct {
	Value *string
}

// NullClear clears a field via PATCH (sends JSON null).
func NullClear() *NullableString {
	return &NullableString{}
}

// NullSet sets a field to s via PATCH.
func NullSet(s string) *NullableString {
	return &NullableString{Value: &s}
}

func (n NullableString) MarshalJSON() ([]byte, error) {
	if n.Value == nil {
		return []byte("null"), nil
	}

	return json.Marshal(*n.Value)
}

// Task mirrors the JSON-LD representation of the Task API resource
// (see backend/src/Entity/Task.php), a superset of internal/todotxt.Task's fields:
// same description/details/priority/done/dates/projects/contexts, plus a real
// parentTask IRI in place of the file format's indent-based hierarchy, and no
// "owner" field at all (the API never reads or writes it — see TaskOwnerProcessor).
type Task struct {
	IRI         string     `json:"@id"`
	ID          int        `json:"id"`
	Description string     `json:"description"`
	Details     *string    `json:"details,omitempty"`
	Done        bool       `json:"done"`
	Priority    *string    `json:"priority,omitempty"`
	CreatedOn   flexDate   `json:"createdOn,omitempty"`
	CompletedOn flexDate   `json:"completedOn,omitempty"`
	DueDate     flexDate   `json:"dueDate,omitempty"`
	Projects    []string   `json:"projects"`
	Contexts    []string   `json:"contexts"`
	Extensions  extensions `json:"extensions"`
	ParentTask  *string    `json:"parentTask,omitempty"`
	Children    []string   `json:"children,omitempty"`
	CreatedAt   flexDate   `json:"createdAt,omitempty"`
	UpdatedAt   flexDate   `json:"updatedAt,omitempty"`
}

// TaskInput is the writable subset of Task, used for both creating (POST) and
// partially updating (PATCH) a task. Fields left nil are omitted from PATCH requests
// (leave unchanged). Priority, CompletedOn, DueDate, and ParentTask can additionally be
// explicitly cleared with NullClear() — see NullableString.
type TaskInput struct {
	Description *string         `json:"description,omitempty"`
	Details     *string         `json:"details,omitempty"`
	Done        *bool           `json:"done,omitempty"`
	Priority    *NullableString `json:"priority,omitempty"`
	CreatedOn   *string         `json:"createdOn,omitempty"` // "2006-01-02"
	CompletedOn *NullableString `json:"completedOn,omitempty"`
	DueDate     *NullableString `json:"dueDate,omitempty"`
	Projects    *[]string       `json:"projects,omitempty"`
	Contexts    *[]string       `json:"contexts,omitempty"`
	ParentTask  *NullableString `json:"parentTask,omitempty"` // IRI, e.g. "/api/tasks/3"
}

// taskCollectionResponse is the Hydra collection envelope the API wraps a task
// listing in; only the fields a client actually needs are modeled here.
type taskCollectionResponse struct {
	Member     []Task `json:"member"`
	TotalItems int    `json:"totalItems"`
	View       *struct {
		Next string `json:"next"`
	} `json:"view"`
}

// ListTasks fetches every task visible to the authenticated user, across as many pages
// as the API Platform default pagination (30 per page) splits them into — walking
// view.next until a page doesn't have one. The backend scopes the underlying query to
// the current user server-side (see backend/src/Doctrine/CurrentUserExtension.php), so
// this never contains another user's tasks.
func (c *Client) ListTasks(ctx context.Context) ([]Task, error) {
	var tasks []Task

	path := tasksPath
	for path != "" {
		collection, err := c.fetchTaskPage(ctx, path)
		if err != nil {
			return nil, err
		}

		tasks = append(tasks, collection.Member...)

		if collection.View == nil {
			path = ""
		} else {
			path = collection.View.Next
		}
	}

	return tasks, nil
}

func (c *Client) fetchTaskPage(ctx context.Context, path string) (*taskCollectionResponse, error) {
	resp, err := c.do(ctx, http.MethodGet, path, nil, "")
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, decodeAPIError(resp)
	}

	var collection taskCollectionResponse
	if err := json.NewDecoder(resp.Body).Decode(&collection); err != nil {
		return nil, fmt.Errorf("apiclient: decoding task collection: %w", err)
	}

	return &collection, nil
}

// GetTask fetches a single task by id.
func (c *Client) GetTask(ctx context.Context, id int) (*Task, error) {
	resp, err := c.do(ctx, http.MethodGet, taskPath(id), nil, "")
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, decodeAPIError(resp)
	}

	return decodeTask(resp)
}

// CreateTask creates a new task owned by the authenticated user. Any ParentTask
// IRI in input must reference a task owned by the same user, or the API rejects it.
func (c *Client) CreateTask(ctx context.Context, input TaskInput) (*Task, error) {
	body, err := json.Marshal(input)
	if err != nil {
		return nil, fmt.Errorf("apiclient: encoding task input: %w", err)
	}

	resp, err := c.do(ctx, http.MethodPost, tasksPath, body, mimeJSONLD)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated {
		return nil, decodeAPIError(resp)
	}

	return decodeTask(resp)
}

// UpdateTask partially updates a task (RFC 7396 JSON Merge Patch): only fields set
// in input are changed.
func (c *Client) UpdateTask(ctx context.Context, id int, input TaskInput) (*Task, error) {
	body, err := json.Marshal(input)
	if err != nil {
		return nil, fmt.Errorf("apiclient: encoding task input: %w", err)
	}

	resp, err := c.do(ctx, http.MethodPatch, taskPath(id), body, mimeMergePatch)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, decodeAPIError(resp)
	}

	return decodeTask(resp)
}

// DeleteTask deletes a task. Deleting a task cascades to its subtasks
// (see the parentTask mapping's onDelete: 'CASCADE' in backend/src/Entity/Task.php).
func (c *Client) DeleteTask(ctx context.Context, id int) error {
	resp, err := c.do(ctx, http.MethodDelete, taskPath(id), nil, "")
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusNoContent {
		return decodeAPIError(resp)
	}

	return nil
}

func taskPath(id int) string {
	return tasksPath + "/" + strconv.Itoa(id)
}

func decodeTask(resp *http.Response) (*Task, error) {
	var task Task
	if err := json.NewDecoder(resp.Body).Decode(&task); err != nil {
		return nil, fmt.Errorf("apiclient: decoding task: %w", err)
	}

	return &task, nil
}
