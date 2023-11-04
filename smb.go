package main

import (
	"io"
	"net"

	"github.com/hirochachacha/go-smb2"
)

type winFile struct {
	netCon  net.Conn
	session *smb2.Session
	share   *smb2.Share
	file    *smb2.File
}

func (f *winFile) Read(p []byte) (n int, err error) {
	n, err = f.file.Read(p)
	if err != nil {
		return 0, err
	}
	return n, nil
}

func (f *winFile) Close() error {
	if err := f.file.Close(); err != nil {
		return err
	}

	if err := f.share.Umount(); err != nil {
		return err
	}

	if err := f.session.Logoff(); err != nil {
		return err
	}

	if err := f.netCon.Close(); err != nil {
		return err
	}

	return nil
}

// Windows からファイルを読み出す
func opemSMB2File(name string) (io.ReadCloser, error) {
	conn, err := net.Dial("tcp", "d1.comame.dev:445") // めんどいのでハードコード
	if err != nil {
		return nil, err
	}

	d := &smb2.Dialer{
		Initiator: &smb2.NTLMInitiator{
			User:     "read-itunes",
			Password: "read-itunes",
		},
	}

	s, err := d.Dial(conn)
	if err != nil {
		return nil, err
	}

	smbfs, err := s.Mount("iTunes")
	if err != nil {
		return nil, err
	}

	sf, err := smbfs.Open(name)
	if err != nil {
		return nil, err
	}

	return &winFile{
		netCon:  conn,
		session: s,
		share:   smbfs,
		file:    sf,
	}, nil
}
