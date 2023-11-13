package main

import (
	"bufio"
	"embed"
	"encoding/json"
	"encoding/xml"
	"errors"
	"fmt"
	"io"
	"io/fs"
	"log"
	"mime"
	"net/http"
	"net/url"
	"os"
	"os/exec"
	"path"
	"regexp"
	"strconv"
	"strings"

	"github.com/comame/router-go"
)

//go:embed front/dist
var distFs embed.FS

func main() {
	router.Get("/api/tracks", func(w http.ResponseWriter, r *http.Request) {
		tracks, _, err := getLibrary()
		if err != nil {
			log.Println(err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		js, err := json.Marshal(tracks)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		w.Write(js)
	})

	router.Get("/api/playlists", func(w http.ResponseWriter, r *http.Request) {
		_, playlists, err := getLibrary()
		if err != nil {
			log.Println(err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

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

		tracks, _, err := getLibrary()
		if err != nil {
			log.Println(err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		var track *track
		for _, tr := range tracks {
			if tr.PersistentID == persistentID {
				track = &tr
				break
			}
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

		f, err := openSMB(loc)
		if err != nil {
			log.Println(err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		defer f.Close()

		st, err := f.Stat()
		if err != nil {
			log.Println(err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		typ := mime.TypeByExtension(path.Ext(loc))
		w.Header().Set("Content-Type", typ)
		w.Header().Set("Accept-Ranges", "bytes")

		rh := r.Header.Get("Range")
		rb, re, err := parseRangeHeader(rh)
		if err != nil {
			w.Header().Set("Content-Length", fmt.Sprint(st.Size()))
			io.Copy(w, f)
			return
		}

		if rb < 0 {
			log.Println("不正な Range")
			w.Header().Set("Content-Length", fmt.Sprint(st.Size()))
			io.Copy(w, f)
			return
		}

		if re < 0 {
			w.Header().Set("Content-Length", fmt.Sprint(st.Size()-int64(rb)))
			w.Header().Set("Content-Range", fmt.Sprintf("bytes %d-%d/%d", rb, st.Size()-1, st.Size()))
			w.WriteHeader(http.StatusPartialContent)
			f.Seek(int64(rb), io.SeekStart)
			io.Copy(w, f)
			return
		}

		w.Header().Set("Content-Length", fmt.Sprint(re-rb))
		w.Header().Set("Content-Range", fmt.Sprintf("bytes %d-%d/%d", rb, re-1, st.Size()))
		w.WriteHeader(http.StatusPartialContent)
		f.Seek(int64(rb), io.SeekStart)
		io.Copy(w, f)
	})

	var cachedTracks []track

	router.Get("/api/artwork/:persistent_id", func(w http.ResponseWriter, r *http.Request) {
		p := router.Params(r)
		persistentID := p["persistent_id"]

		// ライブラリにアクセスしたとき、大量に同時アクセスが飛んでくるため、メモリ上にトラック情報をキャッシュする
		if cachedTracks == nil {
			t, _, err := getLibrary()
			if err != nil {
				log.Println(err)
				w.WriteHeader(http.StatusInternalServerError)
				return
			}
			cachedTracks = t
		}

		var track *track
		for _, tr := range cachedTracks {
			if tr.PersistentID == persistentID {
				track = &tr
				break
			}
		}

		if track == nil {
			w.WriteHeader(http.StatusNotFound)
			return
		}

		pf, err := extractArtworks(*track)
		if err != nil {
			log.Println("ext: " + err.Error())
			w.WriteHeader(http.StatusNotFound)
			return
		}
		defer pf.Close()

		w.WriteHeader(http.StatusOK)
		io.Copy(w, pf)
	})

	router.Get("/*", func(w http.ResponseWriter, r *http.Request) {
		sub, err := fs.Sub(distFs, "front/dist")
		if err != nil {
			panic(err)
		}
		srv := http.FileServer(http.FS(sub))
		srv.ServeHTTP(w, r)
	})

	log.Println("Start http://localhost:8080/")
	http.ListenAndServe(":8080", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, ok := os.LookupEnv("DEV")
		if ok {
			// log.Println(r.URL.Path)
			allowCORSForDev(w)
		}
		router.Handler().ServeHTTP(w, r)
	}))
}

// SMB から iTunes Music Library.xml を取得し、パースして返す
func getLibrary() ([]track, []playlist, error) {
	f, err := openSMB("./iTunes Music Library.xml")
	if err != nil {
		return nil, nil, err
	}
	defer f.Close()

	tracks, playlists, err := parseLibraryXML(f)
	if err != nil {
		return nil, nil, err
	}

	return tracks, playlists, nil
}

// track のアートワーク画像を返す。
// 一度取得されたアートワークはファイルシステムにキャッシュされる。キャッシュがなければ SMB から音声ファイルを取得して、ffmpeg でアートワークを抽出する。
func extractArtworks(track track) (io.ReadCloser, error) {
	loc, err := convLocation(track.Locaton)
	if err != nil {
		return nil, err
	}

	afpath := track.PersistentID + path.Ext(loc)

	// とりあえず初回キャッシュを見てみて、存在すればそのまま返す。
	fpf, _ := os.Open(".ar/" + afpath + ".jpg")
	if fpf != nil {
		return fpf, nil
	}

	// SMB から音声ファイルを取ってきて、
	f, err := openSMB(loc)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	// ... 作業フォルダを作り、
	os.MkdirAll(".ar", 0777)

	// ... オーディオファイルを開き、もしなければダウンロードし、
	af, err := os.Open(".ar/" + afpath)
	if errors.Is(err, os.ErrNotExist) {
		cf, err := os.Create(".ar/" + afpath)
		if err != nil {
			return nil, err
		}
		if _, err := io.Copy(cf, f); err != nil {
			return nil, err
		}
		if err := cf.Sync(); err != nil {
			return nil, err
		}
		af = cf
	} else if err != nil {
		return nil, err
	}
	defer af.Close()

	// ... ffmpeg でアートワークを抽出し、
	exec.Command("ffmpeg", "-i", ".ar/"+afpath, "-an", "-c:v", "copy", ".ar/"+afpath+".jpg").Run()
	// エラーは握りつぶす。もしここで失敗していたら、次の os.Open でコケるはず

	// ... 抽出されたアートワークを開く。
	pf, err := os.Open(".ar/" + afpath + ".jpg")
	if err != nil {
		return nil, err
	}

	return pf, nil
}

// 開発環境では CORS ヘッダを返す
func allowCORSForDev(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", "http://localhost:5173")
	w.Header().Set("Access-Control-Allow-Credentials", "true")
}

func parseRangeHeader(v string) (int, int, error) {
	rp := regexp.MustCompile(`^bytes=(\d+)-(\d+)?$`)
	fo := rp.FindAllStringSubmatch(v, 2)
	if fo == nil {
		return -1, -1, errors.New("unsupported or invalid format of range header")
	}

	sstr := fo[0][1]
	estr := "-1"

	if len(fo[0]) == 3 && fo[0][2] != "" {
		estr = fo[0][2]
	}

	sint, err := strconv.ParseInt(sstr, 10, 64)
	if err != nil {
		return -1, -1, err
	}
	eint, err := strconv.ParseInt(estr, 10, 64)
	if err != nil {
		return -1, -1, err
	}

	return int(sint), int(eint), nil
}

// iTunes Music Library.xml の Location を SMB のパスに変換する
func convLocation(p string) (string, error) {
	prefix := os.Getenv("ITUNES_LOCATION_PREFIX")
	p = "." + p[len(prefix):]
	p = strings.ReplaceAll(p, "+", "%2B")
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
	Kind         string
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
				case "Total Time":
					currentTrack.TotalTime = intValue
				case "Disc Number":
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
				case "Kind":
					currentTrack.Kind = strToken
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
