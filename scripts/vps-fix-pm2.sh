#!/bin/bash
set -euo pipefail
APP_DIR=/var/www/visitagadir
STANDALONE="$APP_DIR/.next/standalone"

cp -f "$APP_DIR/.env" "$STANDALONE/.env"
mkdir -p "$STANDALONE/public/uploads/blog" "$STANDALONE/public/uploads/listings/imported" "$STANDALONE/public/uploads/blog/imported"
rsync -a "$APP_DIR/public/uploads/" "$STANDALONE/public/uploads/" 2>/dev/null || true

pm2 delete visitagadir 2>/dev/null || true
cd "$STANDALONE"
HOSTNAME=0.0.0.0 PORT=3000 NODE_ENV=production pm2 start server.js --name visitagadir
pm2 save

sleep 4
pm2 status
ss -tlnp | grep 3000
curl -sI http://127.0.0.1:3000 | head -8
curl -sI http://72.60.23.34 | head -8
