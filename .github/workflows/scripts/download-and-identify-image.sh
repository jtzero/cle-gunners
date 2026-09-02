#!/usr/bin/env bash
set -x
set -euo pipefail

IMAGE_PATH="public/${INPUT_IMAGE_FILENAME}"
case "${INPUT_IMAGE_URL}" in
http://* | https://*) ;;
*)
  echo "error: image URL must use http or https" >&2
  exit 1
  ;;
esac
PUBLIC_ROOT="$(realpath -m public)"
DEST="$(realpath -m "${IMAGE_PATH}")"
case "${DEST}" in
"${PUBLIC_ROOT}"/*) ;;
*)
  echo "error: image destination must remain beneath public/" >&2
  exit 1
  ;;
esac
mkdir -p "$(dirname "${IMAGE_PATH}")"
curl -L -o "${IMAGE_PATH}" "${INPUT_IMAGE_URL}"

DIMENSIONS=$(identify -format "%wx%h" "${IMAGE_PATH}")
if [ -z "${DIMENSIONS}" ]; then
  echo "error: failed to identify image dimensions for ${IMAGE_PATH}" >&2
  exit 1
fi

WIDTH="${DIMENSIONS%x*}"
HEIGHT="${DIMENSIONS#*x}"

{
  echo "image-path=${IMAGE_PATH}"
  echo "image-dimensions=${DIMENSIONS}"
  echo "dimensions=${DIMENSIONS}"
  echo "image-width=${WIDTH}"
  echo "image-height=${HEIGHT}"
} >>"${GITHUB_OUTPUT}"
