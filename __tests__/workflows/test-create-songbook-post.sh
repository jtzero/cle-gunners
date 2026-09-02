#!/usr/bin/env bash
set -euo pipefail

export PATH="${HOME}/.local/bin:${PATH}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

WORKFLOW="test-create-songbook-post.yml"
IMAGE="catthehacker/ubuntu:act-latest"

cleanup() {
  rm -f "${PROJECT_ROOT}/src/content/posts/test-song-post.md"
  rm -f "${PROJECT_ROOT}/public/test-song-post.jpg"
}
trap cleanup EXIT

echo "==> Running create-songbook-post integration test via act"
act push \
  --workflows "${PROJECT_ROOT}/.github/workflows/${WORKFLOW}" \
  --artifact-server-path /tmp/act-artifacts \
  --container-architecture linux/amd64 \
  -P "${IMAGE}" \
  --rm \
  --workdir "${PROJECT_ROOT}"

echo "==> Integration test passed"
