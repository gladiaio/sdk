package gladia_test

import (
	"testing"

	"github.com/gladiaio/sdk-go"
	"github.com/gladiaio/sdk-go/clientoptions"
)

func TestNewGladiaClientRequiresKeyOnCloud(t *testing.T) {
	_, err := gladia.NewGladiaClient(&clientoptions.GladiaClientOptions{
		APIURL: "https://api.gladia.io",
	})
	if err == nil {
		t.Fatal("expected error without API key on gladia.io")
	}
}

func TestNewGladiaClientProxyWithoutKey(t *testing.T) {
	c, err := gladia.NewGladiaClient(&clientoptions.GladiaClientOptions{
		APIURL: "https://proxy.example.com/gladia",
	})
	if err != nil {
		t.Fatal(err)
	}
	if c == nil {
		t.Fatal("expected client")
	}
}
