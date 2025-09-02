import { Metadata } from 'next'
import Link from 'next/link'
import Downloader from '@/components/downloader'
import TrustedPartners from '@/components/trusted-partners'
import AnimatedHero from '@/components/animated-hero'
import Breadcrumb from '@/components/breadcrumb'
import { getLatestPosts, formatDate } from '@/lib/blog'
import { Calendar, Clock, Tag, ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'RedGifs Downloader – Bulk download HD videos in seconds',
  description: 'Stop wasting time — download RedGifs HD videos and cover images in seconds with our free online tool.',
  openGraph: {
    title: 'RedGifs Downloader – Bulk download HD videos in seconds',
    description: 'Stop wasting time — download RedGifs HD videos and cover images in seconds with our free online tool.',
    type: 'website',
    url: 'https://redgifsdownloader.top',
    siteName: 'RedGifs Downloader',
    images: [
      {
        url: '/og.jpg',
        width: 1200,
        height: 630,
        alt: 'RedGifs Downloader - Free Video Download Tool',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RedGifs Downloader – Bulk download HD videos in seconds',
    description: 'Stop wasting time — download RedGifs HD videos and cover images in seconds with our free online tool.',
    images: ['/og.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function Home() {
  const latestPosts = getLatestPosts(4)

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <AnimatedHero />

      {/* Breadcrumb Navigation */}
      <div className="container mx-auto px-4">
        <Breadcrumb />
      </div>

      {/* Downloader Component */}
      <section className="py-16 pt-0">
        <div className="container mx-auto px-4">
          <Downloader />
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Download RedGifs videos in just three simple steps
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-primary font-bold text-lg">1</span>
              </div>
              <h3 className="font-semibold mb-2">Paste URL</h3>
              <p className="text-sm text-muted-foreground">
                Copy and paste the RedGifs URL into the input field above
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-primary font-bold text-lg">2</span>
              </div>
              <h3 className="font-semibold mb-2">Click Search</h3>
              <p className="text-sm text-muted-foreground">
                Our system processes the URL and generates download links
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-primary font-bold text-lg">3</span>
              </div>
              <h3 className="font-semibold mb-2">Save Files</h3>
              <p className="text-sm text-muted-foreground">
                Download the HD video, and cover image to your device
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Blog Posts Section */}
      <section className="py-16 bg-muted/30">
        {/* 结构化数据 */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "RedGifs Downloader",
              "description": "Free RedGifs video, thumbnail and cover downloader tool",
              "url": "https://redgifsdownloader.top",
              "applicationCategory": "MultimediaApplication",
              "operatingSystem": "Any",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "featureList": [
                "HD Video Downloads",
                "Batch Downloads", 
                "Cover Image Downloads",
                "Fast and Secure"
              ]
            })
          }}
        />
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Latest Blog Posts</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Stay updated with the latest tips, guides, and news about RedGifs downloading
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="grid gap-6">
              {latestPosts.map((post) => (
                <article key={post.id} className="bg-card rounded-lg p-6 border hover:shadow-md transition-shadow">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    {post.featured && (
                      <span className="px-2 py-1 bg-primary text-primary-foreground rounded text-xs font-medium">
                        Featured
                      </span>
                    )}
                    {post.tags.slice(0, 2).map((tag) => (
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
                    <h3 className="text-xl font-semibold mb-3 group-hover:text-primary transition-colors line-clamp-2">
                      {post.title}
                    </h3>
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
            
            <div className="text-center mt-8">
              <Link 
                href="/blog" 
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                View All Posts
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured On Section */}
      <TrustedPartners />
    </div>
  )
}
