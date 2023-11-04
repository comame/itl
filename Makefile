SHELL=/bin/bash

include .env
export

.PHONY: build dev

build:
	rm -rf front/dist
	cd front && npx vite build
	go build -o out .

dev:
	cd front && npx vite &
	DEV=1 go run .

dev-setup:
	cd front && npm ci
	go mod tidy
