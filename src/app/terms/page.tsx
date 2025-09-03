import { Metadata } from 'next'
import Breadcrumb from '@/components/breadcrumb'

export const metadata: Metadata = {
  title: 'Terms of Service - RedGifs Downloader',
  description: 'Terms of Service for RedGifs Downloader. Read our terms and conditions for using our free video download service.',
  openGraph: {
    title: 'Terms of Service - RedGifs Downloader',
    description: 'Terms of Service for RedGifs Downloader. Read our terms and conditions for using our free video download service.',
    type: 'website',
    url: 'https://redgifsdownloader.top/terms',
    siteName: 'RedGifs Downloader',
    images: [
      {
        url: '/og.jpg',
        width: 1200,
        height: 630,
        alt: 'RedGifs Downloader Terms of Service',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Terms of Service - RedGifs Downloader',
    description: 'Terms of Service for RedGifs Downloader. Read our terms and conditions for using our free video download service.',
    images: ['/og.jpg'],
  },
}

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <Breadcrumb />
        
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
          <p className="text-muted-foreground">
            Last updated: December 2, 2024
          </p>
        </div>

        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p className="mb-4 leading-relaxed">
              By accessing and using RedGifs Downloader (&quot;the Service&quot;), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
            <p className="mb-4 leading-relaxed">
              RedGifs Downloader is a free web-based tool that allows users to download videos, thumbnails, and cover images from RedGifs platform. The service is provided &quot;as is&quot; without any warranties.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. User Responsibilities</h2>
            <p className="mb-4 leading-relaxed">You agree to:</p>
            <ul className="list-disc list-inside mb-4 space-y-2">
              <li>Use the service only for lawful purposes</li>
              <li>Respect copyright and intellectual property rights</li>
              <li>Not download content without proper authorization</li>
              <li>Not use the service to infringe on others&apos; rights</li>
              <li>Not attempt to reverse engineer or exploit the service</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Content and Copyright</h2>
            <p className="mb-4 leading-relaxed">
              Users are solely responsible for ensuring they have the right to download and use any content obtained through our service. We do not claim ownership of any downloaded content and are not responsible for copyright infringement by users.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Privacy and Data</h2>
            <p className="mb-4 leading-relaxed">
              We do not store or log the URLs you process or the content you download. All processing is done client-side when possible. For more details, please refer to our Privacy Policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Service Availability</h2>
            <p className="mb-4 leading-relaxed">
              We strive to maintain service availability but do not guarantee uninterrupted access. The service may be temporarily unavailable due to maintenance, updates, or technical issues.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Limitation of Liability</h2>
            <p className="mb-4 leading-relaxed">
              RedGifs Downloader and its operators shall not be liable for any direct, indirect, incidental, special, or consequential damages resulting from the use or inability to use the service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Prohibited Uses</h2>
            <p className="mb-4 leading-relaxed">You may not use our service to:</p>
            <ul className="list-disc list-inside mb-4 space-y-2">
              <li>Download copyrighted content without permission</li>
              <li>Violate any applicable laws or regulations</li>
              <li>Harass, abuse, or harm others</li>
              <li>Distribute malware or harmful code</li>
              <li>Attempt to gain unauthorized access to our systems</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Termination</h2>
            <p className="mb-4 leading-relaxed">
              We reserve the right to terminate or suspend access to our service immediately, without prior notice, for any reason, including breach of these Terms of Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Changes to Terms</h2>
            <p className="mb-4 leading-relaxed">
              We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting. Your continued use of the service constitutes acceptance of the modified terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Governing Law</h2>
            <p className="mb-4 leading-relaxed">
              These terms shall be governed by and construed in accordance with applicable laws, without regard to conflict of law provisions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">12. Contact Information</h2>
            <p className="mb-4 leading-relaxed">
              If you have any questions about these Terms of Service, please contact us through our FAQ page or support channels.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
