#!/usr/bin/env bash
# Sync tools/tldraw-mcp/ → the standalone public repo. Re-run after engine changes.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
git subtree split --prefix=tools/tldraw-mcp -b tldraw-mcp-export
git push git@github.com:jinsoo/tldraw-mcp.git tldraw-mcp-export:main --force
git branch -D tldraw-mcp-export
echo "synced tools/tldraw-mcp → github.com/jinsoo/tldraw-mcp"
