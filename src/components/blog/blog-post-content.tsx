'use client'

import { useMemo } from 'react'
import { DynamicAdSlot } from '@/components/dynamic-ad-slot'
import { splitBlogContentForAds } from '@/lib/blog/content-ad-breakpoints'

interface BlogPostContentProps {
  html: string
}

export function BlogPostContent({ html }: BlogPostContentProps) {
  const segments = useMemo(() => splitBlogContentForAds(html), [html])

  return (
    <div className="blog-content prose prose-gray max-w-none bg-white rounded-2xl shadow-sm p-6 sm:p-8">
      {segments.map((segment, index) =>
        segment.type === 'ad' ? (
          <DynamicAdSlot
            key={`blog-ad-${index}`}
            location="blog_content_inline"
            className="my-8 not-prose"
          />
        ) : (
          <div
            key={`blog-html-${index}`}
            dangerouslySetInnerHTML={{ __html: segment.html }}
          />
        ),
      )}
    </div>
  )
}
