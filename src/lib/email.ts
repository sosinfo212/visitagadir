import nodemailer from 'nodemailer'

const smtpHost = process.env.SMTP_HOST
const smtpPort = Number(process.env.SMTP_PORT || 465)
const smtpUser = process.env.SMTP_USER
const smtpPass = process.env.SMTP_PASS
const smtpFrom = process.env.SMTP_FROM || smtpUser

function getTransport() {
  if (!smtpHost || !smtpUser || !smtpPass) {
    return null
  }

  const secure = process.env.SMTP_SECURE === 'true' || smtpPort === 465

  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
    tls: {
      minVersion: 'TLSv1.2',
    },
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
  })
}

export async function sendEmail(options: {
  to: string
  subject: string
  html: string
  text?: string
  replyTo?: string
}): Promise<boolean> {
  const transport = getTransport()
  if (!transport || !smtpFrom) {
    console.warn('SMTP not configured; skipping email to', options.to)
    return false
  }

  try {
    await transport.sendMail({
      from: `Agadir Directory <${smtpFrom}>`,
      to: options.to,
      replyTo: options.replyTo,
      subject: options.subject,
      html: options.html,
      text: options.text,
    })
    return true
  } catch (error) {
    console.error('Failed to send email:', error)
    return false
  }
}

export async function sendNewReviewNotification(options: {
  ownerEmail: string
  ownerName: string | null
  listingName: string
  listingSlug: string
  authorName: string
  rating: number
  comment: string
}) {
  const siteUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  const manageUrl = `${siteUrl}/my-listings`
  const greeting = options.ownerName ? `Hi ${options.ownerName},` : 'Hi,'

  const subject = `New review on ${options.listingName} (${options.rating}/5)`
  const text = [
    greeting,
    '',
    `Someone left a review on your listing "${options.listingName}".`,
    `Rating: ${options.rating}/5`,
    `Comment: ${options.comment}`,
    '',
    `Manage your listings and reply: ${manageUrl}`,
  ].join('\n')

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#111">
      <p>${greeting}</p>
      <p>Someone left a review on your listing <strong>${options.listingName}</strong>.</p>
      <p><strong>Rating:</strong> ${'★'.repeat(options.rating)}${'☆'.repeat(5 - options.rating)} (${options.rating}/5)</p>
      <p><strong>From:</strong> ${options.authorName}</p>
      <p style="background:#f5f5f5;padding:12px;border-radius:8px">${options.comment}</p>
      <p>The review is pending moderation. Once approved, you can reply from your dashboard.</p>
      <p><a href="${manageUrl}" style="display:inline-block;background:#f97316;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">Manage my listings</a></p>
    </div>
  `

  return sendEmail({ to: options.ownerEmail, subject, html, text })
}

export async function sendContactFormNotification(options: {
  adminEmail: string
  name: string
  email: string
  subject?: string
  message: string
}) {
  const trimmedSubject = options.subject?.trim()
  const subject = trimmedSubject
    ? `[Contact] ${trimmedSubject}`
    : `[Contact] Message from ${options.name}`

  const text = [
    'New contact form submission',
    '',
    `Name: ${options.name}`,
    `Email: ${options.email}`,
    trimmedSubject ? `Subject: ${trimmedSubject}` : '',
    '',
    options.message,
  ]
    .filter(Boolean)
    .join('\n')

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#111">
      <h2 style="margin:0 0 16px">New contact form message</h2>
      <p><strong>Name:</strong> ${options.name}</p>
      <p><strong>Email:</strong> <a href="mailto:${options.email}">${options.email}</a></p>
      ${trimmedSubject ? `<p><strong>Subject:</strong> ${trimmedSubject}</p>` : ''}
      <p style="background:#f5f5f5;padding:12px;border-radius:8px;white-space:pre-wrap">${options.message}</p>
    </div>
  `

  return sendEmail({
    to: options.adminEmail,
    subject,
    html,
    text,
    replyTo: options.email,
  })
}
