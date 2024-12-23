#!/bin/bash

for e in ./examples/*; do
    DIR="$(realpath "$e")"
    [ ! -d "$DIR" ] && continue
    [ ! -z "$1" ] && [ "$1" != $(basename "$DIR") ] && continue
    echo "testing $DIR..."
    (
        set -e
        cd "$DIR"
        npm install
        npx link@latest ../../packages/typeconf
        npm run build
    ) || echo "fail"
    echo "done"

done
