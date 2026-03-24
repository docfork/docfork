#!/usr/bin/env bash
# Creates gitignored symlinks to the backend repo for cross-repo Claude Code context.
# Usage: ./scripts/setup-bridge.sh [path-to-backend]
set -euo pipefail

BACKEND_DIR="${1:-../../backend}"

if [ ! -d "$BACKEND_DIR" ]; then
  echo "Error: backend repo not found at $BACKEND_DIR"
  echo "Usage: ./scripts/setup-bridge.sh [path-to-backend]"
  exit 1
fi

mkdir -p .claude/bridge

ln -sfn "$(cd "$BACKEND_DIR/docs" && pwd)" .claude/bridge/docs
ln -sfn "$(cd "$BACKEND_DIR/.claude/skills" && pwd)" .claude/bridge/skills
[ -f "$BACKEND_DIR/CLAUDE.md" ] && ln -sfn "$(cd "$BACKEND_DIR" && pwd)/CLAUDE.md" .claude/bridge/claude.md

echo "Bridge created -> .claude/bridge/"
echo "  docs   -> $(readlink .claude/bridge/docs)"
echo "  skills -> $(readlink .claude/bridge/skills)"
[ -L .claude/bridge/claude.md ] && echo "  claude.md -> $(readlink .claude/bridge/claude.md)"
