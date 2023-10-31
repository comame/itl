package main

import (
	"bufio"
	"encoding/json"
	"encoding/xml"
	"errors"
	"io"
	"log"
	"mime"
	"net"
	"net/http"
	"net/url"
	"path"
	"strconv"

	"github.com/comame/router-go"
	"github.com/dhowden/tag"
	"github.com/hirochachacha/go-smb2"
)

func main() {
	conn, err := net.Dial("tcp", "d1.comame.dev:445") // めんどいのでハードコード
	if err != nil {
		panic(err)
	}
	defer conn.Close()

	d := &smb2.Dialer{
		Initiator: &smb2.NTLMInitiator{
			User:     "read-itunes",
			Password: "read-itunes",
		},
	}

	s, err := d.Dial(conn)
	if err != nil {
		panic(err)
	}
	defer s.Logoff()

	fs, err := s.Mount("iTunes")
	if err != nil {
		panic(err)
	}
	defer fs.Umount()

	flib, err := fs.Open("./iTunes Music Library.xml")
	if err != nil {
		panic(err)
	}
	defer flib.Close()

	tracks, playlists, err := parseLibraryXML(flib)
	if err != nil {
		panic(err)
	}

	router.Get("/api/tracks", func(w http.ResponseWriter, r *http.Request) {
		js, err := json.Marshal(tracks)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		w.Write(js)
	})
	router.Get("/api/playlists", func(w http.ResponseWriter, r *http.Request) {
		js, err := json.Marshal(playlists)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		w.Write(js)
	})
	router.Get("/api/track/:persistent_id", func(w http.ResponseWriter, r *http.Request) {
		p := router.Params(r)
		persistentID := p["persistent_id"]

		var track *track
		for _, tr := range tracks {
			if tr.PersistentID != persistentID {
				continue
			}
			track = &tr
		}

		if track == nil {
			w.WriteHeader(http.StatusNotFound)
			return
		}

		loc, err := convLocation(track.Locaton)
		if err != nil {
			log.Println(err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		f, err := fs.Open(loc)
		if err != nil {
			log.Println(err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		defer f.Close()

		typ := mime.TypeByExtension(path.Ext(loc))
		w.Header().Set("Content-Type", typ)

		io.Copy(w, f)
	})
	router.Get("/api/artwork/:persistent_id", func(w http.ResponseWriter, r *http.Request) {
		p := router.Params(r)
		persistentID := p["persistent_id"]

		var track *track
		for _, tr := range tracks {
			if tr.PersistentID != persistentID {
				continue
			}
			track = &tr
		}

		if track == nil {
			w.WriteHeader(http.StatusNotFound)
			return
		}

		loc, err := convLocation(track.Locaton)
		if err != nil {
			log.Println(err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		f, err := fs.Open(loc)
		if err != nil {
			log.Println(err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		defer f.Close()

		m, err := tag.ReadFrom(f)
		if err != nil {
			log.Println(err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		if m.Picture() == nil {
			w.WriteHeader(http.StatusNotFound)
			return
		}

		w.Header().Set("Content-Type", m.Picture().MIMEType)
		w.Write(m.Picture().Data)
	})

	log.Println("Start http://localhost:8080/")
	http.ListenAndServe(":8080", router.Handler())
}

func convLocation(p string) (string, error) {
	prefix := "file://localhost/C:/Users/comame/Music/iTunes"
	p = "." + p[len(prefix):]
	p, err := url.QueryUnescape(p)
	if err != nil {
		return "", err
	}
	return p, nil
}

type track struct {
	ID           int
	TotalTime    int
	DiscNumber   int
	DiscCount    int
	TrackNumber  int
	TrackCount   int
	Year         int
	PersistentID string
	Name         string
	Artist       string
	AlbumArtist  string
	Album        string
	Genre        string
	Locaton      string
}

type playlist struct {
	ID           int
	PersistentID string
	Name         string
	ItemTrackIDs []int
}

// iTunes Music Library.xml をパースする。気合の塊
func parseLibraryXML(r io.Reader) ([]track, []playlist, error) {
	rb := bufio.NewReader(r)
	d := xml.NewDecoder(rb)

	isReadingKey := false

	isReadingTracks := false
	isReadingPlaylists := false

	key := ""
	valueType := "integer" // or "string"

	dictDepth := 0

	var tracks []track
	currentTrack := track{}

	var playlists []playlist
	currentPlaylist := playlist{}

	for {
		rt, err := d.Token()
		if err != nil && errors.Is(err, io.EOF) {
			break
		}
		if err != nil {
			return nil, nil, err
		}

		switch token := rt.(type) {
		case xml.StartElement:
			name := token.Name.Local

			if name == "key" {
				isReadingKey = true
			}

			if name == "dict" || name == "array" {
				dictDepth += 1
			}

			if name == "string" {
				valueType = "string"
			}
			if name == "integer" {
				valueType = "integer"
			}
		case xml.EndElement:
			name := token.Name.Local

			if name == "key" {
				isReadingKey = false
			}

			if name == "dict" || name == "array" {
				dictDepth -= 1

				if isReadingTracks && dictDepth == 2 {
					tracks = append(tracks, currentTrack)
					currentTrack = track{}
				}
				if isReadingPlaylists && dictDepth == 2 {
					playlists = append(playlists, currentPlaylist)
					currentPlaylist = playlist{}
				}
			}

			if name == "integer" || name == "string" {
				valueType = ""
			}
		case xml.CharData:
			strToken := string(token)

			if isReadingKey {
				if !isReadingTracks && !isReadingPlaylists && strToken == "Tracks" {
					isReadingTracks = true
				}
				if isReadingTracks && !isReadingPlaylists && strToken == "Playlists" {
					isReadingTracks = false
					isReadingPlaylists = true
				}
			}

			if isReadingTracks && dictDepth == 3 {
				if isReadingKey {
					key = strToken
				}

				if valueType != "integer" && valueType != "string" {
					continue
				}

				intValue := 0
				if valueType == "integer" {
					v, err := strconv.ParseInt(strToken, 10, 64)
					if err != nil {
						return nil, nil, err
					}
					intValue = int(v)
				}

				switch key {
				case "Track ID":
					currentTrack.ID = intValue
				case "TotalTime":
					currentTrack.TotalTime = intValue
				case "Disk Number":
					currentTrack.DiscNumber = intValue
				case "Disc Count":
					currentTrack.DiscCount = intValue
				case "Track Number":
					currentTrack.TrackNumber = intValue
				case "Track Count":
					currentTrack.TrackCount = intValue
				case "Persistent ID":
					currentTrack.PersistentID = strToken
				case "Year":
					currentTrack.Year = intValue
				case "Name":
					currentTrack.Name = strToken
				case "Artist":
					currentTrack.Artist = strToken
				case "Album Artist":
					currentTrack.AlbumArtist = strToken
				case "Album":
					currentTrack.Album = strToken
				case "Genre":
					currentTrack.Genre = strToken
				case "Location":
					currentTrack.Locaton = strToken
				}
			}

			if isReadingPlaylists && dictDepth == 3 {
				if isReadingKey {
					key = strToken
				}

				if valueType != "integer" && valueType != "string" {
					continue
				}

				intValue := 0
				if valueType == "integer" {
					v, err := strconv.ParseInt(strToken, 10, 64)
					if err != nil {
						return nil, nil, err
					}
					intValue = int(v)
				}

				switch key {
				case "Playlist ID":
					currentPlaylist.ID = intValue
				case "Playlist Persistent ID":
					currentPlaylist.PersistentID = strToken
				case "Name":
					currentPlaylist.Name = strToken
				}
			}

			if isReadingPlaylists && dictDepth == 5 {
				if valueType != "integer" {
					continue
				}
				v, err := strconv.ParseInt(strToken, 10, 64)
				if err != nil {
					return nil, nil, err
				}
				currentPlaylist.ItemTrackIDs = append(currentPlaylist.ItemTrackIDs, int(v))
			}
		}
	}

	return tracks, playlists, nil
}
