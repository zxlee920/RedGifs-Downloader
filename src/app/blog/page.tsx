import { Metadata } from 'next'
import Link from 'next/link'
import { getLatestPosts, formatDate } from '@/lib/blog'
import { Calendar, Clock, Tag, ArrowRight } from 'lucide-react'
import Breadcrumb from '@/components/breadcrumb'
import { siteConfig } from '@/config/site'

export const dynamic = 'force-static'

export const metadata: Metadata = {
  title: 'Blog - RedGifs Downloader',
  description: 'Latest news, tips, and updates about RedGifs downloader tool',
  openGraph: {
    title: 'Blog - RedGifs Downloader',
    description: 'Latest news, tips, and updates about RedGifs downloader tool',
    type: 'website',
    url: siteConfig.getUrl('/blog'),
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.ogImage,
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

export default function BlogPage({ searchParams }: BlogPageProps) {
  const posts = getLatestPosts()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <Breadcrumb />
        
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Blog</h1>
          <p className="text-muted-foreground">
            Latest news, tips, and updates about RedGifs downloader tool
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
              "url": siteConfig.getUrl('/blog'),
              "publisher": {
                "@type": "Organization",
                "name": siteConfig.name,
                "url": siteConfig.baseUrl
              }
            })
          }}
        />
        
        <div className="grid gap-6 mb-8">
          {posts.map((post: any) => (
            <article key={post.id} className="bg-card rounded-lg p-6 border hover:shadow-md transition-shadow">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {post.featured && (
                  <span className="px-2 py-1 bg-primary text-primary-foreground rounded text-xs font-medium">
                    Featured
                  </span>
                )}
                {post.tags.map((tag: string) => (
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
              </div>
            </article>
          ))}
        </div>

      </div>
    </div>
  )
}
