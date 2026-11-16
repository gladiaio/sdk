package gladia_test

import (
	"testing"

	gladia "github.com/gladiaio/sdk/packages/sdk-go"
	"github.com/gladiaio/sdk/packages/sdk-go/clientoptions"
)

func TestNewClientRequiresKeyOnCloud(t *testing.T) {
	t.Setenv("GLADIA_API_KEY", "")
	_, err := gladia.NewClient(&clientoptions.GladiaClientOptions{
		APIURL: "https://api.gladia.io",
	})
	if err == nil {
		t.Fatal("expected error without API key on gladia.io")
	}
}

func TestNewClientProxyWithoutKey(t *testing.T) {
	c, err := gladia.NewClient(&clientoptions.GladiaClientOptions{
		APIURL: "https://proxy.example.com/gladia",
	})
	if err != nil {
		t.Fatal(err)
	}
	if c == nil {
		t.Fatal("expected client")
	}
}
