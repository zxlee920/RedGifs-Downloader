import { Metadata } from 'next'
import Breadcrumb from '@/components/breadcrumb'
import { siteConfig } from '@/config/site'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export const metadata: Metadata = {
  title: 'FAQ - RedGifs Downloader',
  description: 'Frequently asked questions about RedGifs downloader tool',
  openGraph: {
    title: 'FAQ - RedGifs Downloader',
    description: 'Frequently asked questions about RedGifs downloader tool',
    type: 'website',
    url: siteConfig.getUrl('/faq'),
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: 'RedGifs Downloader FAQ',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FAQ - RedGifs Downloader',
    description: 'Frequently asked questions about RedGifs downloader tool',
    images: ['/og.jpg'],
  },
}

export default function FAQPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <Breadcrumb />
        <h1 className="text-4xl font-bold mb-8">Frequently Asked Questions</h1>
        
        {/* 结构化数据 */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": [
                {
                  "@type": "Question",
                  "name": "How does the RedGifs downloader work?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Our downloader uses the official RedGifs API to fetch video information and provides direct download links. Simply paste the RedGifs URL and click download to get the video file."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Is it safe to use this downloader?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes, our downloader is completely safe. We don't store any videos on our servers - everything is processed client-side and downloads are direct from RedGifs servers."
                  }
                },
                {
                  "@type": "Question",
                  "name": "What video formats are supported?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "We support high-definition MP4 videos and 1080x1920 JPG format cover images. You can choose the best format for your needs."
                  }
                }
              ]
            })
          }}
        />
        
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger className="text-lg">How does the RedGifs downloader work?</AccordionTrigger>
            <AccordionContent className="text-base">
              Our downloader uses the official RedGifs API to fetch video information and provides direct download links. 
              Simply paste the RedGifs URL and click download to get the video file.
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-2">
            <AccordionTrigger className="text-lg">Is it safe to use this downloader?</AccordionTrigger>
            <AccordionContent className="text-base">
              Yes, our downloader is completely safe. We don&apos;t store any videos on our servers - everything is processed 
              client-side and downloads are direct from RedGifs servers.
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-3">
            <AccordionTrigger className="text-lg">What video formats are supported?</AccordionTrigger>
            <AccordionContent className="text-base">
              We support high-definition MP4 videos and 1080x1920 JPG format cover images. 
              You can choose the best format for your needs.
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-5">
            <AccordionTrigger className="text-lg">Is there a limit to how many videos I can download?</AccordionTrigger>
            <AccordionContent className="text-base">
              There are no artificial limits imposed by our tool. However, please respect RedGifs&apos; terms of service 
              and use the downloader responsibly.
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-4">
            <AccordionTrigger className="text-lg">Do you support extensions and macOS/Windows apps?</AccordionTrigger>
            <AccordionContent className="text-base">
              Not currently, but we&apos;re definitely planning to support them in the future. Stay tuned for updates!
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-6">
            <AccordionTrigger className="text-lg">Do you support bulk downloads?</AccordionTrigger>
            <AccordionContent className="text-base">
              Yes, we fully support bulk downloads! Simply switch to the &quot;Batch Download&quot; tab on the homepage to download and preview multiple videos at once.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  )
}
