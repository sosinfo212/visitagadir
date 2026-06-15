import { db } from '@/lib/db'

async function ensureAdSettings() {
  let row = await db.adSettings.findFirst({ orderBy: { createdAt: 'asc' } })
  if (!row) {
    row = await db.adSettings.create({ data: {} })
  }
  return row
}

export async function getAdsTxtContent(): Promise<string> {
  const row = await ensureAdSettings()
  return row.adsTxt?.trim() ?? ''
}

export async function updateAdsTxtContent(content: string): Promise<string> {
  const row = await ensureAdSettings()
  const normalized = content.trim()
  const updated = await db.adSettings.update({
    where: { id: row.id },
    data: { adsTxt: normalized || null },
  })
  return updated.adsTxt?.trim() ?? ''
}
