package main

import (
	"fmt"
	"io"
	"log"
	"net/http"

	"github.com/octarect/xtract"
)

const sankeiURL = "https://www.sankei.com/"

type page struct {
	Titles []string `xpath:"//a[contains(@class,'headline')]/text()"`
}

// FetchTitles fetches the HTML at the given URL and returns article titles.
func FetchTitles(client *http.Client, url string) ([]string, error) {
	resp, err := client.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var p page
	if err := xtract.Unmarshal(body, &p); err != nil {
		return nil, err
	}

	return p.Titles, nil
}

func main() {
	titles, err := FetchTitles(http.DefaultClient, sankeiURL)
	if err != nil {
		log.Fatal(err)
	}
	for _, title := range titles {
		fmt.Println(title)
	}
}
