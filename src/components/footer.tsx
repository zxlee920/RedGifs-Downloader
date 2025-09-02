import Link from 'next/link'
import { Separator } from '@/components/ui/separator'
import { Download, Github, Twitter } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-28">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
            <img src="/lightning-logo.svg?v=1" alt="Lightning Logo" className="h-6 w-6" />
              <span className="font-bold text-lg">RedGifs Downloader</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Fast, secure, and free HD RedGifs video downloader with cover and bulk download support.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <h3 className="font-semibold">Features</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>HD Video Downloads</li>
              <li>Batch Downloads</li>
              <li>Cover Image Downloads</li>
              <li>Fast and Secure</li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h3 className="font-semibold">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/terms" className="text-muted-foreground hover:text-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} RedGifs Downloader. All rights reserved.
          </p>
          <div className="flex items-center space-x-6">
            <Link href="/" className="text-muted-foreground hover:text-primary transition-colors text-sm">
              Home
            </Link>
            <Link href="/blog" className="text-muted-foreground hover:text-primary transition-colors text-sm">
              Blog
            </Link>
            <Link href="/faq" className="text-muted-foreground hover:text-primary transition-colors text-sm">
              FAQ
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
