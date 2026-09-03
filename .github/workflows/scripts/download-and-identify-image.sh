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

FORMAT=$(identify -format "%m" "${IMAGE_PATH}")
case "$(echo "${FORMAT}" | tr '[:upper:]' '[:lower:]')" in
jpeg | jpg) EXTENSION="jpg" ;;
png) EXTENSION="png" ;;
gif) EXTENSION="gif" ;;
webp) EXTENSION="webp" ;;
avif) EXTENSION="avif" ;;
tiff | tif) EXTENSION="tif" ;;
bmp) EXTENSION="bmp" ;;
*)
  echo "error: unsupported image format '${FORMAT}' for ${IMAGE_PATH}" >&2
  exit 1
  ;;
esac

FINAL_REQUESTED_FILENAME="${INPUT_IMAGE_FILENAME}.${EXTENSION}"
FINAL_IMAGE_PATH="public/${FINAL_REQUESTED_FILENAME}"

if [[ "${FINAL_IMAGE_PATH}" != "${IMAGE_PATH}" ]]; then
  mv "${IMAGE_PATH}" "${FINAL_IMAGE_PATH}"
fi

WIDTH="${DIMENSIONS%x*}"
HEIGHT="${DIMENSIONS#*x}"

{
  echo "image-path=${FINAL_IMAGE_PATH}"
  echo "image-file-name=${FINAL_REQUESTED_FILENAME}"
  echo "image-extension=${EXTENSION}"
  echo "image-dimensions=${DIMENSIONS}"
  echo "dimensions=${DIMENSIONS}"
  echo "image-width=${WIDTH}"
  echo "image-height=${HEIGHT}"
} >>"${GITHUB_OUTPUT}"
