import crypto from 'crypto'
import { db } from '@/lib/db'
import { sendEmail } from '@/lib/email'

const VERIFY_EXPIRY_HOURS = 24

function verificationUrl(email: string, token: string) {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  const params = new URLSearchParams({ token, email })
  return `${baseUrl}/api/auth/verify-email?${params.toString()}`
}

export async function sendVerificationEmail(email: string, name: string | null): Promise<boolean> {
  const token = crypto.randomBytes(32).toString('hex')
  const expires = new Date(Date.now() + VERIFY_EXPIRY_HOURS * 60 * 60 * 1000)

  await db.verificationToken.deleteMany({ where: { identifier: email } })
  await db.verificationToken.create({
    data: { identifier: email, token, expires },
  })

  const verifyUrl = verificationUrl(email, token)
  const greeting = name ? `Hi ${name},` : 'Hi,'

  return sendEmail({
    to: email,
    subject: 'Verify your Agadir Directory account',
    text: [
      greeting,
      '',
      'Thanks for signing up. Please verify your email address by opening this link:',
      verifyUrl,
      '',
      `This link expires in ${VERIFY_EXPIRY_HOURS} hours.`,
      '',
      'If you did not create an account, you can ignore this email.',
    ].join('\n'),
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#111">
        <p>${greeting}</p>
        <p>Thanks for signing up for <strong>Agadir Directory</strong>. Please verify your email address to manage your business listings.</p>
        <p><a href="${verifyUrl}" style="display:inline-block;background:linear-gradient(90deg,#f97316,#14b8a6);color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">Verify my email</a></p>
        <p style="font-size:13px;color:#666">Or copy this link into your browser:<br><a href="${verifyUrl}">${verifyUrl}</a></p>
        <p style="font-size:13px;color:#666">This link expires in ${VERIFY_EXPIRY_HOURS} hours.</p>
        <p style="font-size:13px;color:#666">If you did not create an account, you can ignore this email.</p>
      </div>
    `,
  })
}

export type VerifyEmailResult = 'ok' | 'invalid' | 'expired' | 'already_verified'

export async function verifyEmailToken(email: string, token: string): Promise<VerifyEmailResult> {
  const normalizedEmail = email.trim().toLowerCase()
  const user = await db.user.findUnique({ where: { email: normalizedEmail } })
  if (!user) return 'invalid'
  if (user.emailVerified) return 'already_verified'

  const record = await db.verificationToken.findFirst({
    where: { identifier: normalizedEmail, token },
  })
  if (!record) return 'invalid'
  if (record.expires < new Date()) {
    await db.verificationToken.deleteMany({
      where: { identifier: normalizedEmail, token },
    })
    return 'expired'
  }

  await db.$transaction([
    db.user.update({
      where: { email: normalizedEmail },
      data: { emailVerified: new Date() },
    }),
    db.verificationToken.deleteMany({ where: { identifier: normalizedEmail } }),
  ])

  return 'ok'
}
