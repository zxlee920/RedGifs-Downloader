import { Metadata } from 'next'
import Link from 'next/link'
import { Calendar, Clock, Tag } from 'lucide-react'
import Breadcrumb from '@/components/breadcrumb'
import Pagination from '@/components/pagination'
import { getPaginatedPosts, formatDate } from '@/lib/blog'

export const metadata: Metadata = {
  title: 'Blog - RedGifs Downloader',
  description: 'Latest news, tips, and updates about RedGifs downloader tool',
  openGraph: {
    title: 'Blog - RedGifs Downloader',
    description: 'Latest news, tips, and updates about RedGifs downloader tool',
    type: 'website',
    url: 'https://redgifsdownloader.top/blog',
    siteName: 'RedGifs Downloader',
    images: [
      {
        url: '/og.jpg',
        width: 1200,
        height: 630,
        alt: 'RedGifs Downloader Blog',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog - RedGifs Downloader',
    description: 'Latest news, tips, and updates about RedGifs downloader tool',
    images: ['/og.jpg'],
  },
}

interface BlogPageProps {
  searchParams: {
    page?: string
  }
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const { page } = await searchParams
  const currentPage = parseInt(page || '1', 10)
  const { posts, totalPages, totalPosts } = getPaginatedPosts(currentPage, 6)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <Breadcrumb />
        
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Blog</h1>
          <p className="text-muted-foreground">
            Latest news, tips, and updates about RedGifs downloader tool ({totalPosts} articles)
          </p>
        </div>

        {/* 结构化数据 */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Blog",
              "name": "RedGifs Downloader Blog",
              "description": "Latest news, tips, and updates about RedGifs downloader tool",
              "url": "https://redgifsdownloader.top/blog",
              "publisher": {
                "@type": "Organization",
                "name": "RedGifs Downloader",
                "url": "https://redgifsdownloader.top"
              }
            })
          }}
        />
        
        <div className="grid gap-6 mb-8">
          {posts.map((post) => (
            <article key={post.id} className="bg-card rounded-lg p-6 border hover:shadow-md transition-shadow">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {post.featured && (
                  <span className="px-2 py-1 bg-primary text-primary-foreground rounded text-xs font-medium">
                    Featured
                  </span>
                )}
                {post.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs"
                  >
                    <Tag className="h-3 w-3" />
                    {tag}
                  </span>
                ))}
              </div>
              
              <Link href={`/blog/${post.id}`} className="block group">
                <h2 className="text-2xl font-semibold mb-4 group-hover:text-primary transition-colors">
                  {post.title}
                </h2>
                <p className="text-muted-foreground mb-4 line-clamp-3">
                  {post.excerpt}
                </p>
              </Link>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDate(post.publishedAt)}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {post.readTime} min read
                </div>
                <span>By {post.author}</span>
              </div>
            </article>
          ))}
        </div>

        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            basePath="/blog"
            className="mt-8"
          />
        )}
      </div>
    </div>
  )
}
