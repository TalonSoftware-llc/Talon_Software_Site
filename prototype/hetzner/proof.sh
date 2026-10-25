#!/bin/sh
set -eu
cd "$(dirname "$0")"
docker compose up -d --build --wait
node --test proof/pathway.test.mjs
