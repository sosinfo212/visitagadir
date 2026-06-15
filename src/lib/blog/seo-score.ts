import { stripHtml } from './html'
import {
  averageParagraphLength,
  averageSentenceLength,
  firstNWords,
  parseBlogContent,
} from './content-analysis'

export type SeoCheckStatus = 'pass' | 'warning' | 'fail'

export interface SeoCheck {
  status: SeoCheckStatus
  title: string
  message: string
}

export interface SeoScoreResult {
  score: number
  grade: 'Excellent' | 'Good' | 'Needs Work' | 'Poor'
  checks: SeoCheck[]
}

export interface BlogSeoInput {
  title: string
  slug: string
  excerpt: string
  content: string
  coverImage?: string
  primaryKeywords: string
  metaDescription: string
  seoTitle: string
}

function primaryKeyword(raw: string): string {
  return raw.split(',')[0]?.trim().toLowerCase() ?? ''
}

function keywordInText(text: string, keyword: string): boolean {
  if (!keyword) return false
  return stripHtml(text).toLowerCase().includes(keyword.toLowerCase())
}

function keywordInSlug(slug: string, keyword: string): boolean {
  if (!keyword || !slug) return false
  const slugKw = keyword.toLowerCase().replace(/\s+/g, '-')
  const slugWords = keyword.toLowerCase().split(/\s+/).filter(Boolean)
  const s = slug.toLowerCase()
  return s.includes(slugKw) || slugWords.every((w) => s.includes(w))
}

function check(
  status: SeoCheckStatus,
  title: string,
  message: string,
): SeoCheck {
  return { status, title, message }
}

function gradeFromScore(score: number): SeoScoreResult['grade'] {
  if (score >= 90) return 'Excellent'
  if (score >= 75) return 'Good'
  if (score >= 60) return 'Needs Work'
  return 'Poor'
}

export function calculateBlogSeoScore(input: BlogSeoInput): SeoScoreResult {
  const title = input.title.trim()
  const slug = input.slug.trim()
  const metaTitle = (input.seoTitle.trim() || title).trim()
  const metaDescription = input.metaDescription.trim()
  const keyword = primaryKeyword(input.primaryKeywords)
  const coverImage = input.coverImage?.trim() ?? ''

  const parsed = parseBlogContent(input.content)
  const { wordCount, h2Headings, images, internalLinks, externalLinks, plainText, hasBulletList, hasFaqSection } =
    parsed

  const checks: SeoCheck[] = []
  let score = 0

  // KEYWORD OPTIMIZATION (25)
  if (!keyword) {
    checks.push(check('fail', 'Primary keyword', 'Set a primary keyword to evaluate optimization.'))
    checks.push(check('fail', 'Keyword in title', 'Add your primary keyword to the title.'))
    checks.push(check('fail', 'Keyword in slug', 'Add your primary keyword to the slug.'))
    checks.push(check('fail', 'Keyword in meta', `Add a primary keyword to meta description.`))
    checks.push(check('fail', 'Keyword in intro', 'Use primary keyword in the first 100 words.'))
    checks.push(check('fail', 'Keyword in H2', 'Include primary keyword in at least one H2.'))
  } else {
    checks.push(check('pass', 'Primary keyword', `"${keyword}" is set as focus keyphrase.`))

    if (keywordInText(title, keyword)) {
      score += 5
      checks.push(check('pass', 'Keyword in title', `"${keyword}" appears in the title.`))
    } else {
      checks.push(check('fail', 'Keyword in title', `Add "${keyword}" to the title.`))
    }

    if (keywordInSlug(slug, keyword)) {
      score += 5
      checks.push(check('pass', 'Keyword in slug', 'Primary keyword appears in the slug.'))
    } else if (slug && keyword.split(/\s+/).some((w) => slug.includes(w))) {
      score += 2
      checks.push(check('warning', 'Keyword in slug', `Consider adding "${keyword}" to the slug.`))
    } else {
      checks.push(check('warning', 'Keyword in slug', `Consider adding "${keyword}" to the slug.`))
    }

    if (keywordInText(metaDescription, keyword)) {
      score += 5
      checks.push(check('pass', 'Keyword in meta', `"${keyword}" appears in meta description.`))
    } else {
      checks.push(check('fail', 'Keyword in meta', `Add "${keyword}" to meta description.`))
    }

    const intro = firstNWords(plainText, 100)
    if (keywordInText(intro, keyword)) {
      score += 5
      checks.push(check('pass', 'Keyword in intro', 'Primary keyword appears in the first 100 words.'))
    } else {
      checks.push(check('fail', 'Keyword in intro', `Use "${keyword}" naturally in the opening paragraph.`))
    }

    const inH2 = h2Headings.some((h) => keywordInText(h, keyword))
    if (inH2) {
      score += 5
      checks.push(check('pass', 'Keyword in H2', 'Primary keyword appears in an H2 heading.'))
    } else {
      checks.push(check('fail', 'Keyword in H2', `Add "${keyword}" to at least one H2 heading.`))
    }
  }

  // CONTENT QUALITY (25)
  if (wordCount > 1000) {
    score += 10
    checks.push(check('pass', 'Content length', `${wordCount} words — strong depth.`))
  } else if (wordCount > 600) {
    score += 5
    checks.push(check('warning', 'Content length', `${wordCount} words — aim for 1000+ for best results.`))
  } else {
    checks.push(check('fail', 'Content length', `Article contains only ${wordCount} words. Add more content.`))
  }

  if (h2Headings.length >= 3) {
    score += 5
    checks.push(check('pass', 'H2 headings', `${h2Headings.length} H2 headings — good structure.`))
  } else {
    checks.push(check('fail', 'H2 headings', `Add at least 3 H2 headings (currently ${h2Headings.length}).`))
  }

  if (hasFaqSection) {
    score += 5
    checks.push(check('pass', 'FAQ section', 'FAQ section detected.'))
  } else {
    checks.push(check('fail', 'FAQ section', 'Add an FAQ section with common questions.'))
  }

  const comprehensive =
    wordCount >= 800 && h2Headings.length >= 3 && (hasBulletList || hasFaqSection)
  if (comprehensive) {
    score += 5
    checks.push(check('pass', 'Topic coverage', 'Content structure suggests comprehensive coverage.'))
  } else {
    checks.push(check('warning', 'Topic coverage', 'Expand sections, lists, or FAQs to cover the topic fully.'))
  }

  // READABILITY (15)
  const avgParagraph = averageParagraphLength(input.content)
  if (avgParagraph > 0 && avgParagraph <= 150) {
    score += 5
    checks.push(check('pass', 'Paragraph length', `Average paragraph is ${Math.round(avgParagraph)} words.`))
  } else if (avgParagraph <= 200) {
    score += 2
    checks.push(check('warning', 'Paragraph length', `Break up long paragraphs (avg ${Math.round(avgParagraph)} words).`))
  } else {
    checks.push(check('fail', 'Paragraph length', `Paragraphs are too long (avg ${Math.round(avgParagraph)} words).`))
  }

  if (hasBulletList) {
    score += 5
    checks.push(check('pass', 'Bullet list', 'Bullet or numbered list detected.'))
  } else {
    checks.push(check('fail', 'Bullet list', 'Add a bullet list to improve scanability.'))
  }

  const avgSentence = averageSentenceLength(plainText)
  if (avgSentence > 0 && avgSentence <= 20) {
    score += 5
    checks.push(check('pass', 'Sentence length', `Average sentence is ${avgSentence.toFixed(1)} words.`))
  } else if (avgSentence <= 25) {
    score += 2
    checks.push(check('warning', 'Sentence length', `Shorten sentences (avg ${avgSentence.toFixed(1)} words).`))
  } else {
    checks.push(check('fail', 'Sentence length', `Sentences are too long (avg ${avgSentence.toFixed(1)} words).`))
  }

  // METADATA (15)
  if (metaTitle) {
    score += 5
    checks.push(check('pass', 'Meta title', 'Meta title is set.'))
  } else {
    checks.push(check('fail', 'Meta title', 'Add a meta title for search results.'))
  }

  if (metaDescription) {
    score += 5
    checks.push(check('pass', 'Meta description', 'Meta description is set.'))
  } else {
    checks.push(check('fail', 'Meta description', 'Add a meta description.'))
  }

  if (metaDescription.length >= 120 && metaDescription.length <= 160) {
    score += 5
    checks.push(check('pass', 'Meta length', `Meta description is ${metaDescription.length} characters.`))
  } else if (metaDescription.length > 0) {
    checks.push(check('warning', 'Meta length', `Aim for 120–160 characters (currently ${metaDescription.length}).`))
  } else {
    checks.push(check('fail', 'Meta length', 'Meta description should be 120–160 characters.'))
  }

  // IMAGES (10)
  if (coverImage) {
    score += 3
    checks.push(check('pass', 'Featured image', 'Featured image detected.'))
  } else {
    checks.push(check('fail', 'Featured image', 'Add a featured image.'))
  }

  if (images.length >= 1) {
    score += 2
    checks.push(check('pass', 'Content images', `${images.length} image(s) in content.`))
  } else {
    checks.push(check('fail', 'Content images', 'Add at least one image to the article.'))
  }

  const allImages = images
  const imagesWithAlt = allImages.filter((img) => img.alt.length > 0)
  if (allImages.length === 0) {
    checks.push(check('warning', 'Image alt text', 'No content images to evaluate alt text.'))
  } else if (imagesWithAlt.length === allImages.length) {
    score += 5
    checks.push(check('pass', 'Image alt text', 'All images have alt text.'))
  } else {
    const missing = allImages.length - imagesWithAlt.length
    checks.push(check('fail', 'Image alt text', `${missing} image(s) missing alt text.`))
  }

  // LINKING (10)
  if (internalLinks.length >= 2) {
    score += 5
    checks.push(check('pass', 'Internal links', `${internalLinks.length} internal links found.`))
  } else if (internalLinks.length === 1) {
    score += 2
    checks.push(check('warning', 'Internal links', 'Add at least 2 internal links to related pages.'))
  } else {
    checks.push(check('fail', 'Internal links', 'Add at least 2 internal links to related pages.'))
  }

  if (externalLinks.length >= 1) {
    score += 5
    checks.push(check('pass', 'External links', `${externalLinks.length} external authority link(s) found.`))
  } else {
    checks.push(check('fail', 'External links', 'Add at least 1 external link to an authority source.'))
  }

  return {
    score: Math.min(100, score),
    grade: gradeFromScore(score),
    checks,
  }
}
