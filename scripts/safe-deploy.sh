#!/usr/bin/env bash
#
# Safe production (re)build + reload for the Next.js standalone app.
#
# WHY THIS EXISTS
#   `npm run build` starts with `rm -rf .next`, and PM2 serves from
#   `.next/standalone/`. So the moment a build starts it deletes the
#   currently-serving code, and if `next build` then FAILS the chain stops
#   before `pm2 restart` and the site is left returning 5xx with no on-disk
#   build to fall back to. That exact sequence took the origin down on
#   2026-08-24 and caused a Google Search Console "Couldn't fetch" on the
#   sitemap (Google's fetch hit the 5xx window).
#
# WHAT THIS DOES
#   1. Snapshots the current working .next (hardlink copy — near-instant).
#   2. Runs the normal clean build.
#   3. On success  -> graceful `pm2 reload` and drop the snapshot.
#   4. On FAILURE  -> restore .next from the snapshot and restart, so the
#      site returns to the last known-good build automatically. A broken
#      build can no longer leave the site down.
#
# USAGE (on the server, from the app root):
#   bash scripts/safe-deploy.sh
#
set -uo pipefail

cd "$(dirname "$0")/.."
APP_DIR="$(pwd)"
BACKUP=".next.rollback"

echo "==> [safe-deploy] app dir: $APP_DIR"

echo "==> Snapshotting current build to $BACKUP …"
rm -rf "$BACKUP"
if [ -d .next ]; then
  # Hardlink copy is near-instant and uses almost no extra disk. Falls back to
  # a normal copy if the filesystem does not support hardlinks.
  cp -al .next "$BACKUP" 2>/dev/null || cp -r .next "$BACKUP"
  echo "    snapshot ready"
else
  echo "    no existing .next to snapshot (first deploy)"
fi

echo "==> Building (npm run build) …"
if npm run build && [ -f .next/standalone/server.js ]; then
  echo "==> Build OK + standalone present → graceful reload"
  # Keep the standalone's env in sync with the app env.
  [ -f .env ] && cp -f .env .next/standalone/.env
  pm2 reload all --update-env 2>/dev/null || pm2 restart all
  rm -rf "$BACKUP"
  echo "==> safe-deploy OK"
  exit 0
else
  echo "!! BUILD FAILED (or standalone/server.js missing) — rolling back"
  rm -rf .next
  if [ -d "$BACKUP" ]; then
    mv "$BACKUP" .next
    pm2 restart all 2>/dev/null || true
    echo "!! Restored previous working build. Site is back on the last good version."
  else
    echo "!! No snapshot to restore from — site may need a manual rebuild."
  fi
  echo "!! Nothing new was deployed. Fix the build error above and re-run."
  exit 1
fi
