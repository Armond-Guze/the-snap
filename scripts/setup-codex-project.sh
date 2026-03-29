#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
SKILL_NAME="the-snap-studio-workflow"
SKILL_SRC="$ROOT_DIR/codex/skills/$SKILL_NAME"
SKILL_DST="$CODEX_HOME/skills/$SKILL_NAME"

if [[ ! -d "$SKILL_SRC" ]]; then
  echo "Missing skill source: $SKILL_SRC" >&2
  exit 1
fi

mkdir -p "$CODEX_HOME/skills"

if [[ -L "$SKILL_DST" || -e "$SKILL_DST" ]]; then
  rm -rf "$SKILL_DST"
fi

ln -s "$SKILL_SRC" "$SKILL_DST"

cat <<EOF
Codex project setup complete.

Installed skill:
  $SKILL_NAME -> $SKILL_DST

Project context:
  $ROOT_DIR/AGENTS.md

Next steps on your PC:
  1. Clone or open this repo at:
     $ROOT_DIR
  2. Run:
     npm install
  3. Start local dev:
     npm run dev
  4. Open the repo root in Codex desktop or Codex CLI

What Codex will know from this setup:
  - The Snap repo structure
  - Sanity Studio article workflow
  - Power rankings workflow
  - Tag / topic hub / team ref rules
  - Headline rewrite format
  - Power rankings rewrite format

If you move the repo to a different folder later, rerun this script so the skill symlink points to the new location.

Optional bootstrap prompt:
  $ROOT_DIR/codex/START-HERE.md
EOF
