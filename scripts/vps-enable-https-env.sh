#!/bin/bash
set -euo pipefail
cd /var/www/visitagadir
sed -i 's|NEXTAUTH_URL="http://72.60.23.34"|NEXTAUTH_URL="https://visitagadir.info"|' .env
sed -i 's|NEXT_PUBLIC_SITE_URL="http://72.60.23.34"|NEXT_PUBLIC_SITE_URL="https://visitagadir.info"|' .env
cp -f .env .next/standalone/.env
pm2 restart visitagadir --update-env
echo DONE
grep -E 'NEXTAUTH_URL|NEXT_PUBLIC_SITE_URL' .env
