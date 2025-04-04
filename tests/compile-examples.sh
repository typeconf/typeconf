#!/bin/bash

PROJECTROOT="$(dirname "$0")/.."
for e in "$PROJECTROOT/examples"/*; do
    DIR="$(realpath "$e")"
    [ ! -d "$DIR" ] && continue
    [ ! -z "$1" ] && [ "$1" != $(basename "$DIR") ] && continue
    echo "testing $DIR..."
    (
    set -e
    if [ ! -e "$DIR/package.json" ]; then
        npx link@latest "$(dirname "$0")/../packages/typeconf"
        "$PROJECTROOT/packages/typeconf/dist/src/cli.js" build "$DIR"
    else
        cd "$DIR"
        npm install
        npx link@latest ../../packages/sdk
        npx link@latest ../../packages/typeconf
        npm run build
    fi
    ) || echo "fail"
    echo "done"

done
