#!/bin/sh
set -eu
jq -n --arg project "${CURSOR_PROJECT_DIR:?CURSOR_PROJECT_DIR is not set}" '{pluginPaths: [$project + "/plugins/sdlc/cursor"]}'
