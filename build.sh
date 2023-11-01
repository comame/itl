pushd front
    npx vite build
popd

go build -o out .
