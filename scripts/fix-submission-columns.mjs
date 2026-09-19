/**
 * Fix "Failed to submit business" on the List Your Business form.
 *
 * Root cause: Submission.description (and message) are Prisma-default
 * VARCHAR(191). Business owners paste descriptions >191 chars → prisma.create
 * throws P2000 "value too long for column: description" → 500. Widen both to
 * TEXT (non-destructive; DB enforces length, not the client, so no rebuild
 * needed). Idempotent — safe to re-run.
 *
 * Run on the server:  node scripts/fix-submission-columns.mjs
 */
import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()

async function main() {
  console.log('Before:')
  const before = await db.$queryRawUnsafe(
    "SELECT COLUMN_NAME, COLUMN_TYPE FROM information_schema.COLUMNS WHERE TABLE_NAME='Submission' AND COLUMN_NAME IN ('description','message')"
  )
  console.log(before)

  await db.$executeRawUnsafe('ALTER TABLE `Submission` MODIFY `description` TEXT NOT NULL')
  await db.$executeRawUnsafe('ALTER TABLE `Submission` MODIFY `message` TEXT NULL')

  console.log('After:')
  const after = await db.$queryRawUnsafe(
    "SELECT COLUMN_NAME, COLUMN_TYPE FROM information_schema.COLUMNS WHERE TABLE_NAME='Submission' AND COLUMN_NAME IN ('description','message')"
  )
  console.log(after)
  console.log('Done — long descriptions now accepted, no rebuild required.')
}
main().catch((e) => { console.error(e); process.exit(1) }).finally(() => db.$disconnect())
