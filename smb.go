package main

import (
	"io"
	"net"
	"os"

	"github.com/hirochachacha/go-smb2"
)

// Windows から SMB で取得したファイルを表す。io.ReadSeekCloser を実装する。
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

func (f *winFile) Seek(offset int64, whence int) (int64, error) {
	n, err := f.file.Seek(offset, whence)
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
func openSMB(name string) (io.ReadSeekCloser, error) {
	host := os.Getenv("SMB_HOST")
	user := os.Getenv("SMB_USER")
	password := os.Getenv("SMB_PASSWORD")
	sharename := os.Getenv("SMB_SHARENAME")

	conn, err := net.Dial("tcp", host) // めんどいのでハードコード
	if err != nil {
		return nil, err
	}

	d := &smb2.Dialer{
		Initiator: &smb2.NTLMInitiator{
			User:     user,
			Password: password,
		},
	}

	s, err := d.Dial(conn)
	if err != nil {
		return nil, err
	}

	smbfs, err := s.Mount(sharename)
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
