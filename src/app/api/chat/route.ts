import { NextRequest, NextResponse } from 'next/server'

const N8N_WEBHOOK_URL =
  'https://n8n.srv1108618.hstgr.cloud/webhook/a07114c7-e3a6-4e43-8d04-a3994e5a5f5b/chat'

export async function POST(req: NextRequest) {
  const { message, sessionId } = await req.json()

  const res = await fetch(N8N_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chatInput: message, sessionId }),
  })

  if (!res.ok) {
    return NextResponse.json({ error: 'n8n error' }, { status: 502 })
  }

  const data = await res.json()
  return NextResponse.json({ reply: data.output ?? data.text ?? '' })
}
