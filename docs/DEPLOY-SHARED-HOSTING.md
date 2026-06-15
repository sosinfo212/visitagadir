# Deploying Visit Agadir Directory on Shared Hosting

This guide covers deploying the **Visit Agadir Directory** (Next.js 16 + MySQL + Prisma) on typical shared hosting that offers **Node.js** and **MySQL** — most commonly via **cPanel → Setup Node.js App**.

> **This app cannot run on PHP-only shared hosting.** It needs a persistent Node.js process and a MySQL database.

---

## Table of contents

1. [Hosting requirements](#1-hosting-requirements)
2. [Choose your deployment strategy](#2-choose-your-deployment-strategy)
3. [Prepare the application](#3-prepare-the-application)
4. [Create the MySQL database](#4-create-the-mysql-database)
5. [Upload files to the server](#5-upload-files-to-the-server)
6. [Configure the Node.js application (cPanel)](#6-configure-the-nodejs-application-cpanel)
7. [Environment variables](#7-environment-variables)
8. [Install dependencies and build](#8-install-dependencies-and-build)
9. [Initialize the database](#9-initialize-the-database)
10. [Domain, SSL, and reverse proxy](#10-domain-ssl-and-reverse-proxy)
11. [Google OAuth and SMTP](#11-google-oauth-and-smtp)
12. [File uploads and permissions](#12-file-uploads-and-permissions)
13. [Post-deploy checklist](#13-post-deploy-checklist)
14. [Updating after the first deploy](#14-updating-after-the-first-deploy)
15. [Troubleshooting](#15-troubleshooting)

---

## 1. Hosting requirements

Confirm your plan supports all of the following before you start.

| Requirement | Minimum | Notes |
|-------------|---------|-------|
| **Node.js** | 20.x or 22.x | Next.js 16 requires a modern Node runtime |
| **MySQL** | 5.7+ or MariaDB 10.3+ | Used by Prisma |
| **RAM** | 512 MB+ for runtime; 1 GB+ to build on-server | Low-memory hosts: build locally (see [Option B](#option-b-build-locally-upload-standalone-recommended-for-low-memory-hosts)) |
| **Disk** | 500 MB+ | Includes `node_modules`, `.next`, and uploaded images |
| **Process manager** | Node.js app runner (cPanel, Passenger, PM2) | App must stay running; not serverless |
| **SSL** | HTTPS | Required for NextAuth cookies and Google OAuth |
| **Outbound SMTP** | Port 465 or 587 | For review/verification emails |

**Compatible hosting types**

- cPanel with **Setup Node.js App** (Namecheap, Hostinger Business, OVH, etc.)
- Shared hosting with **Phusion Passenger** for Node.js
- Any shared plan that lets you run `node server.js` on a custom port behind Apache/Nginx

**Not compatible**

- Static-only hosting (no Node.js)
- PHP-only WordPress hosting without Node.js support

---

## 2. Choose your deployment strategy

### Option A: Build on the server

Best when your host has **≥ 1 GB RAM** and SSH or Terminal access in cPanel.

1. Upload the full project (or `git clone`).
2. Run `npm install`, `npm run build`, and `npx prisma db push` on the server.

### Option B: Build locally, upload standalone (recommended for low-memory hosts)

Best when the server cannot complete `next build` (out-of-memory errors).

1. Build on your computer.
2. Upload only the **standalone** output plus runtime files.
3. Run `npm install --omit=dev` and `npx prisma generate` on the server.

Both options are detailed below.

---

## 3. Prepare the application

### 3.1 Enable standalone output

The production start script expects a standalone Next.js bundle. Add this to `next.config.ts` **before building**:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
```

### 3.2 Copy environment template

On your machine:

```bash
cp .env.example .env
```

Fill in production values (see [Section 7](#7-environment-variables)).

### 3.3 Create a cPanel entry-point script

Shared hosts usually need a `server.js` file in the **application root**. Create this file in the project root:

```js
// server.js — cPanel / Passenger entry point
const path = require("path");

// Standalone server runs from its own directory
process.chdir(path.join(__dirname, ".next", "standalone"));
process.env.HOSTNAME = process.env.HOSTNAME || "0.0.0.0";
process.env.PORT = process.env.PORT || "3000";

require("./server.js");
```

> cPanel’s Node.js selector often sets `PORT` automatically. Do not hard-code a port in this file.

### 3.4 Production start command

Use **Node.js**, not Bun (most shared hosts do not have Bun):

```bash
NODE_ENV=production node server.js
```

If you update `package.json`, change the `start` script to:

```json
"start": "NODE_ENV=production node server.js"
```

---

## 4. Create the MySQL database

In **cPanel → MySQL® Databases**:

1. **Create a database** — e.g. `visitagadir_db`
2. **Create a user** with a strong password
3. **Add the user to the database** with **ALL PRIVILEGES**
4. Note the connection details. cPanel often prefixes names:

| Field | Example |
|-------|---------|
| Host | `localhost` |
| Database | `cpaneluser_visitagadir` |
| User | `cpaneluser_visitagadir` |
| Password | *(your chosen password)* |
| Port | `3306` |

Build your `DATABASE_URL`:

```
mysql://cpaneluser_visitagadir:YOUR_PASSWORD@localhost:3306/cpaneluser_visitagadir
```

URL-encode special characters in the password (`@`, `#`, `%`, etc.).

---

## 5. Upload files to the server

### Via Git (preferred)

If your host provides SSH:

```bash
cd ~
git clone https://github.com/sosinfo212/visitagadir.git
cd visitagadir
```

### Via FTP / File Manager

Upload the project to a folder such as:

```
/home/YOUR_CPANEL_USER/visitagadir/
```

**Do not upload:**

- `.env` (create it on the server with production secrets)
- `node_modules/` (install on server)
- `.next/` (build on server or upload after local build)
- `visitagadir.WordPress.*.xml` (large import file; upload only when importing)

**Always upload:**

- `public/` (including `public/uploads/` if you have existing images)
- `prisma/schema.prisma`
- `package.json` and `package-lock.json` (if present)

---

## 6. Configure the Node.js application (cPanel)

In **cPanel → Setup Node.js App → Create Application**:

| Setting | Value |
|---------|-------|
| **Node.js version** | 20.x or 22.x |
| **Application mode** | Production |
| **Application root** | `/home/YOUR_USER/visitagadir` |
| **Application URL** | Your domain or subdomain |
| **Application startup file** | `server.js` |
| **Passenger log file** | (default is fine) |

Click **Create**.

Then open the app’s **Environment variables** panel and add every variable from [Section 7](#7-environment-variables). Alternatively, create a `.env` file in the application root (never commit it to Git).

---

## 7. Environment variables

Set these in cPanel’s Node.js env panel **or** in a `.env` file at the project root.

| Variable | Production example | Required |
|----------|-------------------|----------|
| `DATABASE_URL` | `mysql://user:pass@localhost:3306/dbname` | Yes |
| `NEXT_PUBLIC_SITE_URL` | `https://visitagadir.info` | Yes (SEO canonicals & sitemap) |
| `NEXTAUTH_URL` | `https://visitagadir.info` | Yes |
| `NEXTAUTH_SECRET` | Random 32+ character string | Yes |
| `ADMIN_PASSWORD` | Strong admin password | Yes |
| `ADMIN_SECRET_KEY` | Random 32+ character string | Yes |
| `GOOGLE_CLIENT_ID` | From Google Cloud Console | For Google login |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console | For Google login |
| `SMTP_HOST` | `smtp.visitagadir.info` | For emails |
| `SMTP_PORT` | `465` | For emails |
| `SMTP_USER` | `noreply@visitagadir.info` | For emails |
| `SMTP_PASS` | Your mailbox password | For emails |
| `SMTP_FROM` | `noreply@visitagadir.info` | For emails |
| `NODE_ENV` | `production` | Yes |

**Generate secrets locally:**

```bash
openssl rand -base64 32
```

Run twice — once for `NEXTAUTH_SECRET`, once for `ADMIN_SECRET_KEY`.

Copy `.env.example` as a reference; it lists every key with safe placeholders.

---

## 8. Install dependencies and build

Open **cPanel → Terminal** or SSH into the server, then:

```bash
cd ~/visitagadir

# Install production + build dependencies
npm install

# Generate Prisma client
npx prisma generate

# Build Next.js (requires standalone in next.config.ts)
npm run build
```

The build script copies static assets into the standalone folder:

```bash
next build && cp -r .next/static .next/standalone/.next/ && cp -r public .next/standalone/
```

### Option B: Build locally, upload standalone

On your **local machine**:

```bash
npm install
npx prisma generate
npm run build
```

Then upload these paths to the server (merge with existing project):

```
.next/standalone/          →  ~/visitagadir/.next/standalone/
.next/static/              →  ~/visitagadir/.next/standalone/.next/static/
public/                    →  ~/visitagadir/.next/standalone/public/
server.js                  →  ~/visitagadir/server.js
prisma/                    →  ~/visitagadir/prisma/
package.json
```

On the **server** (production deps + Prisma only):

```bash
cd ~/visitagadir
npm install --omit=dev
npx prisma generate
```

---

## 9. Initialize the database

Create all tables from the Prisma schema:

```bash
cd ~/visitagadir
npx prisma db push
```

This project uses `prisma db push` (no migration history folder). For production, that is acceptable on a fresh database.

### Seed categories and sample data (optional)

The seed endpoint is **disabled in production** by default. To populate initial categories:

1. Temporarily sign in to the admin panel, or
2. Import your WordPress export via **Admin → Listings → Import** / **Admin → Blog → Import**

For a WordPress XML import, upload the file through the admin UI after logging in at:

```
https://visitagadir.info/admin/login
```

---

## 10. Domain, SSL, and reverse proxy

### SSL

In cPanel → **SSL/TLS Status**, enable **AutoSSL** or install Let’s Encrypt for `visitagadir.info` and `www.visitagadir.info`.

Both `NEXTAUTH_URL` and `NEXT_PUBLIC_SITE_URL` must use `https://`.

### WWW redirect

Pick one canonical host (e.g. `https://visitagadir.info`) and redirect the other in cPanel **Redirects** or via admin SEO redirect rules.

### Apache / .htaccess (if needed)

cPanel’s Node.js setup usually proxies traffic automatically. If your host requires manual proxy rules, ask support for a **reverse proxy to your Node.js port**.

Do **not** point the document root to `public/` — the Node.js app serves all routes.

---

## 11. Google OAuth and SMTP

### Google OAuth (optional)

In [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials:

1. Edit your OAuth 2.0 Client ID
2. Add **Authorized JavaScript origins**:
   - `https://visitagadir.info`
3. Add **Authorized redirect URIs**:
   - `https://visitagadir.info/api/auth/callback/google`

### SMTP

Use the mailbox credentials from your hosting provider. Typical cPanel mail settings:

| Setting | Value |
|---------|-------|
| Host | `mail.visitagadir.info` or `smtp.visitagadir.info` |
| Port | `465` (SSL) or `587` (STARTTLS) |
| User | Full email address |
| Password | Mailbox password |

Test by submitting a review or signing up a new user after deploy.

---

## 12. File uploads and permissions

The admin panel saves uploads to:

```
public/uploads/blog/
public/uploads/listings/
```

Ensure these directories exist and are writable by the Node.js process:

```bash
mkdir -p public/uploads/blog public/uploads/listings/imported public/uploads/blog/imported
chmod -R 755 public/uploads
```

If uploads fail silently, try `775` or ask your host which user runs Node.js apps.

> Uploaded files live on disk, not in MySQL. Back up `public/uploads/` when you back up the database.

---

## 13. Post-deploy checklist

Run through this list after the first deploy.

- [ ] Homepage loads at `https://visitagadir.info`
- [ ] View source on a listing page — business name appears in `<h1>` (SSR working)
- [ ] `https://visitagadir.info/robots.txt` returns rules
- [ ] `https://visitagadir.info/sitemap.xml` lists pages with correct URLs (not `localhost`)
- [ ] Admin login works at `/admin/login`
- [ ] User login/signup works at `/login` and `/signup`
- [ ] Google OAuth redirects back without error (if enabled)
- [ ] Test email sends (signup verification or review notification)
- [ ] Image upload works in admin blog/listing editors
- [ ] `public/uploads/` is writable
- [ ] SSL padlock shows in the browser
- [ ] In admin **SEO Settings**, set **Site URL** to `https://visitagadir.info` (or rely on `NEXT_PUBLIC_SITE_URL`)

---

## 14. Updating after the first deploy

When you push new code from GitHub:

```bash
cd ~/visitagadir
git pull origin main
npm install
npx prisma generate
npx prisma db push          # only if schema changed
npm run build
```

Then in cPanel → Setup Node.js App → **Restart** the application.

If you use Option B (local build), rebuild locally and re-upload `.next/standalone/`, `.next/static/`, and `public/`.

---

## 15. Troubleshooting

### Application shows “503 Service Unavailable”

- Restart the Node.js app in cPanel
- Check `server.js` exists and `output: "standalone"` was set before build
- Read the Passenger / Node.js error log in cPanel

### `Error: Cannot find module '.next/standalone/server.js'`

- Run `npm run build` again after adding `output: "standalone"` to `next.config.ts`
- Confirm `.next/standalone/server.js` exists on the server

### Database connection errors

- Verify `DATABASE_URL` username, password, and database name match cPanel (including prefixes)
- URL-encode special characters in the password
- Confirm the MySQL user has privileges on the database

### Site still shows `localhost` in canonicals or sitemap

- Set `NEXT_PUBLIC_SITE_URL=https://visitagadir.info`
- Update **Admin → SEO Settings → Site URL**
- Rebuild and restart

### NextAuth / Google login fails

- `NEXTAUTH_URL` must exactly match your public URL (including `https://`)
- Redirect URI in Google Console must match `/api/auth/callback/google`
- Cookies require HTTPS in production

### Emails not sending

- Confirm SMTP host, port, and credentials with your host’s mail docs
- Some shared hosts block outbound SMTP on port 25 — use 465 or 587
- Check spam folder for test messages

### `npm run build` runs out of memory

- Build locally (Option B) and upload the standalone bundle
- Or ask your host to temporarily raise memory limits

### Uploads fail in admin

- Check `public/uploads/` permissions
- Ensure the directory exists and is not read-only

### `cp: .next/standalone/.next: No such file or directory`

- `output: "standalone"` is missing from `next.config.ts` — add it and rebuild

---

## Quick reference

| Item | Path / URL |
|------|------------|
| Public site | `https://visitagadir.info` |
| Admin panel | `https://visitagadir.info/admin/login` |
| User auth | `https://visitagadir.info/login` |
| Health check | Homepage + `/robots.txt` + `/sitemap.xml` |
| Env template | `.env.example` |
| Database schema | `prisma/schema.prisma` |
| GitHub repo | https://github.com/sosinfo212/visitagadir |

---

## Need a simpler hosting option?

If your shared plan does not support Node.js, consider:

- **Vercel** + external MySQL (PlanetScale, Neon, or cPanel remote MySQL)
- A **VPS** (DigitalOcean, Hetzner) with Node 20 + MySQL + Nginx
- Upgrading to a host that includes **Node.js Selector** in cPanel

The application is designed as a full-stack Next.js app and cannot be converted to static HTML without major architectural changes.
