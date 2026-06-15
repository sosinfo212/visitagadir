#!/bin/bash
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

DB_PASS='x4kqu1mPwEZ8FiM7AeYf1I6g'
NEXTAUTH_SECRET='12rgvxAnp5nZdlIPooaQsi0F0PW84u9o'
ADMIN_SECRET_KEY='d07J664T2XUKTEwufARzuXZFBTyyTxsU'
APP_DIR='/var/www/visitagadir'
DOMAIN='visitagadir.info'

echo "==> Updating packages"
apt-get update -qq
apt-get install -y -qq curl ca-certificates gnupg nginx mysql-server build-essential git

echo "==> Installing Node.js 20"
apt-get remove -y nodejs nodejs-doc 2>/dev/null || true
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y -qq nodejs
node -v
npm -v

echo "==> Installing PM2"
npm install -g pm2

echo "==> Starting MySQL"
systemctl enable mysql
systemctl start mysql

echo "==> Configuring database"
mysql -e "CREATE DATABASE IF NOT EXISTS agadir_directory CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -e "CREATE USER IF NOT EXISTS 'agadir'@'localhost' IDENTIFIED BY '${DB_PASS}';"
mysql -e "GRANT ALL PRIVILEGES ON agadir_directory.* TO 'agadir'@'localhost';"
mysql -e "FLUSH PRIVILEGES;"

echo "==> Cloning application"
mkdir -p /var/www
if [ -d "$APP_DIR/.git" ]; then
  cd "$APP_DIR"
  git pull origin main
else
  rm -rf "$APP_DIR"
  git clone https://github.com/sosinfo212/visitagadir.git "$APP_DIR"
  cd "$APP_DIR"
fi

echo "==> Writing environment file"
if [ ! -f "$APP_DIR/.env" ]; then
  cat > "$APP_DIR/.env" <<EOF
DATABASE_URL="mysql://agadir:${DB_PASS}@localhost:3306/agadir_directory"
NEXT_PUBLIC_SITE_URL="https://${DOMAIN}"
ADMIN_PASSWORD="change-me-strong-admin-password"
ADMIN_SECRET_KEY="${ADMIN_SECRET_KEY}"
NEXTAUTH_URL="https://${DOMAIN}"
NEXTAUTH_SECRET="${NEXTAUTH_SECRET}"
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
SMTP_HOST=""
SMTP_PORT="465"
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM=""
EOF
  chmod 600 "$APP_DIR/.env"
  echo "Created $APP_DIR/.env — edit it with production SMTP/OAuth values before going live."
else
  echo "Using existing $APP_DIR/.env"
fi

echo "==> Installing dependencies"
cd "$APP_DIR"
npm install

echo "==> Setting up database schema"
npx prisma generate
npx prisma db push

echo "==> Building application"
npm run build

echo "==> Starting with PM2"
cp -f "$APP_DIR/.env" "$APP_DIR/.next/standalone/.env"
mkdir -p "$APP_DIR/.next/standalone/public/uploads/blog" "$APP_DIR/.next/standalone/public/uploads/listings/imported"
pm2 delete visitagadir 2>/dev/null || true
cd "$APP_DIR/.next/standalone"
HOSTNAME=0.0.0.0 PORT=3000 NODE_ENV=production pm2 start server.js --name visitagadir
pm2 save
pm2 startup systemd -u root --hp /root | tail -1 | bash || true

echo "==> Configuring Nginx"
cat > /etc/nginx/sites-available/visitagadir <<'NGINX'
server {
    listen 80;
    listen [::]:80;
    server_name visitagadir.info www.visitagadir.info;

    client_max_body_size 25M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/visitagadir /etc/nginx/sites-enabled/visitagadir
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl enable nginx
systemctl restart nginx

echo "==> Opening firewall ports (if ufw active)"
if command -v ufw >/dev/null 2>&1 && ufw status | grep -q active; then
  ufw allow OpenSSH
  ufw allow 'Nginx Full'
fi

echo "==> Deployment complete"
pm2 status
curl -sI http://127.0.0.1:3000 | head -5 || true
