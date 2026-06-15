import { BlogPostCard } from '@/components/blog/blog-post-card'
import { DynamicAdSlot } from '@/components/dynamic-ad-slot'
import type { BlogPostCardData } from '@/lib/blog/blog-list-data'

const IN_FEED_AD_INTERVAL = 4

export function BlogPostList({
  posts,
  emptyMessage = 'No posts published yet. Check back soon.',
}: {
  posts: BlogPostCardData[]
  emptyMessage?: string
}) {
  if (posts.length === 0) {
    return <p className="text-center text-muted-foreground py-16">{emptyMessage}</p>
  }

  return (
    <div className="space-y-6">
      {posts.map((post, index) => (
        <div key={post.id}>
          <BlogPostCard post={post} />
          {(index + 1) % IN_FEED_AD_INTERVAL === 0 && index < posts.length - 1 ? (
            <div className="mt-6">
              <DynamicAdSlot location="blog_list_feed" lazy className="min-h-[90px] rounded-xl overflow-hidden" />
            </div>
          ) : null}
        </div>
      ))}
    </div>
  )
}
