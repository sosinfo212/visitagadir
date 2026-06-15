'use client'

import { useEffect, useState } from 'react'
import {
  BarChart3, Search, Star, TrendingUp, Users, Building2, FolderOpen, Loader2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface AnalyticsData {
  overview: {
    totalUsers: number
    totalSearches: number
    searchesLast7Days: number
    totalListings: number
  }
  topSearchTerms: Array<{ term: string; count: number }>
  topBrowsedCategories: Array<{ slug: string; name: string; count: number }>
  topRatedBusinesses: Array<{
    id: string
    name: string
    slug: string
    rating: number
    reviewCount: number
    category: string
    featured: boolean
  }>
  mostReviewedBusinesses: Array<{
    id: string
    name: string
    slug: string
    rating: number
    reviewCount: number
    category: string
  }>
  popularCategories: Array<{
    name: string
    slug: string
    listingCount: number
    browseCount: number
  }>
  recentSearches: Array<{
    query: string | null
    categorySlug: string | null
    createdAt: string
  }>
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`h-3.5 w-3.5 ${s <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`}
        />
      ))}
    </div>
  )
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/analytics')
      .then((res) => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        Loading analytics...
      </div>
    )
  }

  if (!data) return null

  const overviewCards = [
    { label: 'Registered Users', value: data.overview.totalUsers, icon: Users, color: 'text-teal-600', bg: 'bg-teal-50' },
    { label: 'Total Searches', value: data.overview.totalSearches, icon: Search, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Searches (7 days)', value: data.overview.searchesLast7Days, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Live Listings', value: data.overview.totalListings, icon: Building2, color: 'text-amber-600', bg: 'bg-amber-50' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BarChart3 className="h-7 w-7 text-orange-600" />
          Analytics
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          See what visitors search for in Agadir and which businesses perform best.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {overviewCards.map((card) => (
          <Card key={card.label} className="border-0 shadow-sm">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <p className="text-2xl font-bold mt-1">{card.value}</p>
              </div>
              <div className={`${card.bg} p-3 rounded-xl`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top search terms */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Search className="h-4 w-4 text-orange-500" />
              What People Search For
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {data.topSearchTerms.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                No search data yet. Searches are tracked when visitors use the directory search.
              </p>
            ) : (
              <div className="space-y-2">
                {data.topSearchTerms.map((item, i) => (
                  <div key={item.term} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}</span>
                      <span className="text-sm font-medium truncate">&ldquo;{item.term}&rdquo;</span>
                    </div>
                    <Badge variant="secondary">{item.count}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top browsed categories */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-teal-500" />
              Most Browsed Categories
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {data.topBrowsedCategories.length === 0 ? (
              <div className="space-y-2">
                {data.popularCategories.slice(0, 8).map((cat, i) => (
                  <div key={cat.slug} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}</span>
                      <span className="text-sm font-medium">{cat.name}</span>
                    </div>
                    <Badge variant="outline">{cat.listingCount} listings</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {data.topBrowsedCategories.map((item, i) => (
                  <div key={item.slug} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}</span>
                      <span className="text-sm font-medium">{item.name}</span>
                    </div>
                    <Badge variant="secondary">{item.count} views</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top rated businesses */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Star className="h-4 w-4 text-amber-500" />
            Top Rated Businesses in Agadir
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.topRatedBusinesses.map((biz, i) => (
              <div key={biz.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-sm font-bold text-muted-foreground w-6">{i + 1}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{biz.name}</p>
                    <p className="text-xs text-muted-foreground">{biz.category}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                  <StarRating rating={biz.rating} />
                  <span className="text-sm font-bold">{biz.rating}</span>
                  <span className="text-xs text-muted-foreground">({biz.reviewCount})</span>
                  {biz.featured && (
                    <Badge className="bg-amber-100 text-amber-700 text-[10px]">Featured</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent searches */}
      {data.recentSearches.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Recent Searches</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {data.recentSearches.map((s, i) => (
                <div key={i} className="flex items-center justify-between text-sm p-2 border-b border-gray-100 last:border-0">
                  <span>
                    {s.query ? `“${s.query}”` : '—'}
                    {s.categorySlug && (
                      <span className="text-muted-foreground"> in {s.categorySlug}</span>
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground">{formatDate(s.createdAt)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
