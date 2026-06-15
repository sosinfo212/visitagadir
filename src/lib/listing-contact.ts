export function listingWebsiteHref(website: string) {
  const trimmed = website.trim()
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}
