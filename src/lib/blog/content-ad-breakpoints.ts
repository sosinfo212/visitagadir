export type BlogContentSegment =
  | { type: 'html'; html: string }
  | { type: 'ad' }

const BLOCK_END =
  /<\/(?:p|h2|h3|h4|ul|ol|figure|blockquote|div)>/gi

/** Split HTML into render blocks (paragraphs, headings, lists, etc.). */
function splitHtmlBlocks(html: string): string[] {
  const trimmed = html.trim()
  if (!trimmed) return []

  const blocks: string[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  BLOCK_END.lastIndex = 0
  while ((match = BLOCK_END.exec(trimmed)) !== null) {
    const end = match.index + match[0].length
    const chunk = trimmed.slice(lastIndex, end).trim()
    if (chunk) blocks.push(chunk)
    lastIndex = end
  }

  const tail = trimmed.slice(lastIndex).trim()
  if (tail) blocks.push(tail)

  return blocks.length > 0 ? blocks : [trimmed]
}

/** Positions (block index) after which to insert an in-article ad. */
function adInsertAfterIndices(blockCount: number): number[] {
  if (blockCount < 4) return []

  const positions = [2]

  if (blockCount >= 8) {
    const mid = Math.floor(blockCount * 0.55)
    if (mid > 4 && mid < blockCount - 2) positions.push(mid)
  }

  return positions
}

export function splitBlogContentForAds(html: string): BlogContentSegment[] {
  const blocks = splitHtmlBlocks(html)
  if (blocks.length === 0) return []

  const adAfter = new Set(adInsertAfterIndices(blocks.length))
  const segments: BlogContentSegment[] = []

  blocks.forEach((block, index) => {
    segments.push({ type: 'html', html: block })
    if (adAfter.has(index)) segments.push({ type: 'ad' })
  })

  return segments
}
