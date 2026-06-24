#!/usr/bin/env bash
# Keep the engine current with upstream tldraw. Idempotent.
# Usage: ./track-upstream.sh
# WARNING: This bumps the pinned @tldraw/* version in package.json.
#          Do NOT run during active development unless you intend to upgrade.
set -euo pipefail
cd "$(dirname "$0")"
npm update @tldraw/editor @tldraw/store @tldraw/tlschema
VER="$(node -e "console.log(require('@tldraw/editor/package.json').version)")"
echo "installed @tldraw version: $VER"
npm run probe-defaults   # re-extract src/defaults.json from the new version (kills prop drift)
curl -fsSL "https://tldraw.dev/llms-docs.txt" -o llms-docs.txt
# verify the fetched docs are non-empty and record the version they were paired with
test -s llms-docs.txt || { echo "ERROR: llms-docs.txt empty"; exit 1; }
echo "# paired with @tldraw $VER (fetched $(date -u +%Y-%m-%d))" >> llms-docs.txt
npm run build && npm test
echo "track-upstream OK for @tldraw $VER"
