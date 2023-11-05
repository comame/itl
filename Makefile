SHELL=/bin/bash

include .env
export

.PHONY: build dev dev-setup

build:
	rm -rf front/dist
	cd front && VITE_TIME=`date +%Y%m%d-%H%M%S` npx vite build
	go build -o out .

dev:
	cd front && npx vite &
	DEV=1 go run .

dev-setup:
	cd front && npm ci
	go mod tidy
