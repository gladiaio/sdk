package v2

import (
	"encoding/json"
	"fmt"
)

// JobCore provides shared list/get/delete helpers for live and pre-recorded collections.
type JobCore struct {
	BasePath string
	Kind     string
}

// BuildJobEndpoint returns `/v2/.../{id}`.
func (c *JobCore) BuildJobEndpoint(jobID string) string {
	return c.BasePath + "/" + jobID
}

// BuildJobFileEndpoint returns `/v2/.../{id}/file`.
func (c *JobCore) BuildJobFileEndpoint(jobID string) string {
	return c.BasePath + "/" + jobID + "/file"
}

// BuildListEndpoint encodes list params into a collection URL.
func (c *JobCore) BuildListEndpoint(params any) (string, error) {
	if params == nil {
		return c.BasePath, nil
	}
	listParams, err := listParamsFromAny(params)
	if err != nil {
		return "", err
	}
	return BuildListURL(c.BasePath, listParams), nil
}

func listParamsFromAny(params any) (*ListURLParams, error) {
	if p, ok := params.(*ListURLParams); ok {
		return p, nil
	}
	b, err := json.Marshal(params)
	if err != nil {
		return nil, err
	}
	var raw map[string]json.RawMessage
	if err := json.Unmarshal(b, &raw); err != nil {
		return nil, err
	}
	out := &ListURLParams{}
	if v, ok := raw["url"]; ok {
		_ = json.Unmarshal(v, &out.URL)
	}
	if v, ok := raw["date"]; ok {
		_ = json.Unmarshal(v, &out.Date)
	}
	if v, ok := raw["before_date"]; ok {
		_ = json.Unmarshal(v, &out.BeforeDate)
	}
	if v, ok := raw["after_date"]; ok {
		_ = json.Unmarshal(v, &out.AfterDate)
	}
	if v, ok := raw["offset"]; ok {
		var n int
		_ = json.Unmarshal(v, &n)
		out.Offset = &n
	}
	if v, ok := raw["limit"]; ok {
		var n int
		_ = json.Unmarshal(v, &n)
		out.Limit = &n
	}
	if v, ok := raw["status"]; ok {
		_ = json.Unmarshal(v, &out.Status)
	}
	if v, ok := raw["custom_metadata"]; ok {
		_ = json.Unmarshal(v, &out.CustomMetadata)
	}
	return out, nil
}

// IsJobSuccessful reports whether a job finished successfully.
func (c *JobCore) IsJobSuccessful(status string) bool {
	return status == "done"
}

// IsJobFailed reports whether a job ended in error.
func (c *JobCore) IsJobFailed(status string) bool {
	return status == "error"
}

// JobErrorMessage formats a failed job error.
func (c *JobCore) JobErrorMessage(jobID string, errorCode any) string {
	return fmt.Sprintf("%s job %s failed with error code: %v", c.Kind, jobID, errorCode)
}

// JobTimeoutMessage formats a poll timeout error.
func (c *JobCore) JobTimeoutMessage(jobID string, timeout string) string {
	return fmt.Sprintf("%s job %s did not complete within %s", c.Kind, jobID, timeout)
}
