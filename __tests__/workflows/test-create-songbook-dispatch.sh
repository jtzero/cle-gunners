#!/usr/bin/env bash
set -euo pipefail

export PATH="${HOME}/.local/bin:${PATH}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

WORKFLOW="create-songbook-post.yml"

FILENAME="ozil"
TITLE="Test Dispatch Song"
CONTENT="Oh when the gunners go marching in"
IMAGE_FILE="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTxWF2IvCfF9E_q16jfkfvoUqHKD3eLbYa0vcdo5qhI8GEUKBiNk3HIMSg&s=10"
SERVER_DIR="$(mktemp -d)"
SERVER_PID=""
PORT=$(((RANDOM % 2000) + 46000))

cleanup() {
  if [[ -n "${SERVER_PID}" ]]; then
    kill "${SERVER_PID}" 2>/dev/null || true
  fi
  rm -rf "${SERVER_DIR}"
}
trap cleanup EXIT

#echo "==> Generating a portrait test image (200x300)"
#convert -size 200x300 xc:red "${SERVER_DIR}/${IMAGE_FILE}"

#echo "==> Serving test image on "
#(
#  cd "${SERVER_DIR}"
#  python3 -m http.server "${PORT}" --bind 127.0.0.1 >/dev/null 2>&1
#) &
#SERVER_PID=$!

#for _ in $(seq 1 50); do
#  if curl -fsS "http://127.0.0.1:${PORT}/${IMAGE_FILE}" >/dev/null 2>&1; then
#    break
#  fi
#  sleep 0.1
#done
#curl -fsS "http://127.0.0.1:${PORT}/${IMAGE_FILE}" >/dev/null

echo "==> Running create-songbook-post workflow via act"
act workflow_dispatch \
  --directory "${PROJECT_ROOT}" \
  --workflows "${PROJECT_ROOT}/.github/workflows/${WORKFLOW}" \
  --container-architecture linux/amd64 \
  --use-gitignore \
  --rm \
  --input "filename=${FILENAME}" \
  --input "title=${TITLE}" \
  --input "image=${IMAGE_FILE}" \
  --input "content=${CONTENT}"

echo "==> Integration test passed"
