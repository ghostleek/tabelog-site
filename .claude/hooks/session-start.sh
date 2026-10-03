#!/bin/bash
# Install deps in fresh Claude Code on the web containers so `npm run check`
# works from the first turn. No-op locally or when node_modules is present.
set -euo pipefail
[ "${CLAUDE_CODE_REMOTE:-}" = "true" ] || exit 0
cd "$CLAUDE_PROJECT_DIR"
[ -d node_modules ] || npm ci --no-audit --no-fund
