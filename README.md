# Visit Agadir Directory

Visit Agadir Directory is a full-stack business directory and publishing platform for Agadir, Morocco. It combines public business discovery, user accounts, owner submissions, reviews, a blog, advertising controls, SEO management, analytics, and an administration dashboard in one Next.js application.

## Main features

- Searchable local-business directory organized by category and city
- Listing pages with contact details, galleries, ratings, reviews, opening hours, and structured data
- User registration, email verification, Google OAuth, and listing ownership
- Business submissions and owner-managed listings
- Blog and category management with WordPress XML import tools
- Admin dashboard for listings, reviews, users, submissions, ads, tracking pixels, settings, and analytics
- SEO metadata, Schema.org markup, redirects, sitemap, robots, `ads.txt`, and internal-link management
- Google Maps import through a companion Chrome extension
- Responsive interface built with Tailwind CSS and Radix/shadcn components

## Technology

- Next.js 16 and React 19
- TypeScript
- Tailwind CSS 4
- Prisma ORM
- MySQL or MariaDB
- NextAuth.js
- TinyMCE
- PM2 and Nginx for VPS deployments

## Requirements

- Node.js 20 or newer
- npm
- MySQL 5.7+, MySQL 8, or a compatible MariaDB release

## Local setup

1. Clone the repository and install dependencies:

   ```bash
   git clone https://github.com/sosinfo212/visitagadir.git
   cd visitagadir
   npm install
   ```

2. Copy the environment template:

   ```bash
   cp .env.example .env
   ```

3. Create a MySQL database and update `DATABASE_URL` in `.env`:

   ```env
   DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/agadir_directory"
   ```

   For a default XAMPP installation with a passwordless local root user:

   ```env
   DATABASE_URL="mysql://root:@localhost:3306/agadir_directory"
   ```

4. Generate the Prisma client and synchronize the schema:

   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. Start the development server:

   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000). The admin login is available at `/admin/login`.

## Environment variables

Use `.env.example` as the source of truth. Important settings include:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | MySQL/MariaDB connection string |
| `NEXT_PUBLIC_SITE_URL` | Public site URL used for SEO and links |
| `NEXTAUTH_URL` | Base URL used by NextAuth |
| `NEXTAUTH_SECRET` | Secret used to sign authentication data |
| `ADMIN_PASSWORD` | Initial admin password when no database hash is stored |
| `ADMIN_SECRET_KEY` | Secret used to sign admin sessions |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth credentials |
| `SMTP_*` | Email transport configuration |
| `GOOGLE_MAPS_API_KEY` | Google Maps/Places integration |
| `EXTENSION_API_KEY` | Authentication key for the Chrome importer |
| `UPLOAD_ROOT` | Optional persistent upload directory |

Never commit `.env` files or real credentials.

## Useful commands

```bash
npm run dev          # Start the development server
npm run build        # Create a standalone production build
npm run start        # Start the production entry point
npm run lint         # Run ESLint
npm run db:generate  # Generate Prisma Client
npm run db:push      # Synchronize the schema without migrations
npm run db:migrate   # Create/apply a development migration
```

## Project structure

```text
src/app/             Next.js pages, layouts, and API routes
src/components/      Shared public and admin UI
src/lib/             Database, auth, imports, email, listings, blog, and SEO services
prisma/              Prisma schema
public/              Static assets and persistent uploads
chrome-extension/    Google Maps listing importer
scripts/             Import, maintenance, and deployment utilities
docs/                Additional deployment documentation
```

## Chrome extension

The extension in `chrome-extension/` imports listing information from Google Maps. Configure `EXTENSION_API_KEY` in the application and enter the same value in the extension settings. See `chrome-extension/README.md` for installation and usage details.

## Production deployment

The application uses Next.js standalone output. The scripts directory contains VPS deployment helpers for an Nginx, PM2, Node.js, and MySQL stack:

```bash
bash scripts/vps-redeploy.sh
```

Before deploying:

- Configure production secrets directly on the server.
- Back up the database and `public/uploads`.
- Ensure HTTPS is active and `NEXTAUTH_URL` matches the public domain.
- Run `npx prisma generate` and review database changes before applying them.
- Do not store server passwords or database credentials in deployment scripts.

For shared-hosting requirements, see [`docs/DEPLOY-SHARED-HOSTING.md`](docs/DEPLOY-SHARED-HOSTING.md).

## License

This repository does not currently declare an open-source license. All rights are reserved unless the project owner states otherwise.
