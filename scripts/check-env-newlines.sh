#!/usr/bin/env bash
set -euo pipefail

# Checks .env* files for literal "\\n" sequences or trailing CR characters in values.
# Usage: scripts/check-env-newlines.sh [path...]

files=("$@")
if [ ${#files[@]} -eq 0 ]; then
  files=(.env.preview .env.staging .env.production .env.local)
fi

found=0
for f in "${files[@]}"; do
  [ -f "$f" ] || continue
  if grep -n "\\\\n\"$" "$f" >/dev/null 2>&1; then
    echo "[FAIL] $f contains literal \\n at end of value"
    grep -n "\\\\n\"$" "$f" || true
    found=1
  fi
  if grep -n $'\r$' "$f" >/dev/null 2>&1; then
    echo "[FAIL] $f contains CRLF characters"
    grep -n $'\r$' "$f" || true
    found=1
  fi
done

if [ "$found" -ne 0 ]; then
  echo "Env newline check failed. Fix values using printf (not echo)."
  exit 1
fi

echo "Env newline check passed."
