SHELL=/bin/bash

.PHONY: build build_front build_go dev

build: build_front build_go

build_front:
	cd front && npx vite build

build_go:
	go build -o out .

dev:
	cd front && npx vite &
	DEV=1 go run .

	wait -n
	exit $?
