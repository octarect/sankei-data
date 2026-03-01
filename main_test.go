package main

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestFetchTitles(t *testing.T) {
	html := `<html><body>
		<a class="headline" href="/article/1">First Article</a>
		<a class="headline" href="/article/2">Second Article</a>
		<a class="other" href="/article/3">Not an article</a>
	</body></html>`

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/html")
		_, _ = w.Write([]byte(html))
	}))
	defer srv.Close()

	titles, err := FetchTitles(srv.Client(), srv.URL)
	if err != nil {
		t.Fatalf("FetchTitles returned error: %v", err)
	}

	want := []string{"First Article", "Second Article"}
	if len(titles) != len(want) {
		t.Fatalf("got %d titles, want %d", len(titles), len(want))
	}
	for i, w := range want {
		if titles[i] != w {
			t.Errorf("titles[%d] = %q, want %q", i, titles[i], w)
		}
	}
}

func TestFetchTitles_empty(t *testing.T) {
	html := `<html><body><p>No articles here</p></body></html>`

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/html")
		_, _ = w.Write([]byte(html))
	}))
	defer srv.Close()

	titles, err := FetchTitles(srv.Client(), srv.URL)
	if err != nil {
		t.Fatalf("FetchTitles returned error: %v", err)
	}

	if len(titles) != 0 {
		t.Errorf("expected no titles, got %v", titles)
	}
}
