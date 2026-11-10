package e2e_test

import (
	"fmt"
	"os"
	"strings"
	"testing"
)

func TestMain(m *testing.M) {
	if strings.TrimSpace(os.Getenv("GLADIA_API_KEY")) == "" {
		fmt.Fprintln(os.Stderr, `GLADIA_API_KEY is required for e2e-go (set it in the environment, same as e2e-python).`)
		os.Exit(1)
	}
	os.Exit(m.Run())
}
