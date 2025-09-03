import { Metadata } from 'next'
import Breadcrumb from '@/components/breadcrumb'

export const metadata: Metadata = {
  title: 'Privacy Policy - RedGifs Downloader',
  description: 'Privacy Policy for RedGifs Downloader. Learn how we protect your privacy and handle your data.',
  openGraph: {
    title: 'Privacy Policy - RedGifs Downloader',
    description: 'Privacy Policy for RedGifs Downloader. Learn how we protect your privacy and handle your data.',
    type: 'website',
    url: 'https://redgifsdownloader.top/privacy',
    siteName: 'RedGifs Downloader',
    images: [
      {
        url: '/og.jpg',
        width: 1200,
        height: 630,
        alt: 'RedGifs Downloader Privacy Policy',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Privacy Policy - RedGifs Downloader',
    description: 'Privacy Policy for RedGifs Downloader. Learn how we protect your privacy and handle your data.',
    images: ['/og.jpg'],
  },
}

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <Breadcrumb />
        
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground">
            Last updated: December 2, 2024
          </p>
        </div>

        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
            <p className="mb-4 leading-relaxed">
              RedGifs Downloader is designed with privacy in mind. We collect minimal information to provide our service:
            </p>
            <ul className="list-disc list-inside mb-4 space-y-2">
              <li><strong>No Personal Data:</strong> We do not collect names, email addresses, or personal information</li>
              <li><strong>No URL Logging:</strong> We do not store or log the URLs you process</li>
              <li><strong>No Download History:</strong> We do not keep records of what you download</li>
              <li><strong>Technical Data:</strong> Basic server logs for security and performance (IP addresses, timestamps)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. How We Process Data</h2>
            <p className="mb-4 leading-relaxed">
              Our service is designed to protect your privacy:
            </p>
            <ul className="list-disc list-inside mb-4 space-y-2">
              <li><strong>Client-Side Processing:</strong> When possible, processing happens in your browser</li>
              <li><strong>No Data Storage:</strong> URLs and content are processed in real-time without storage</li>
              <li><strong>Temporary Processing:</strong> Any server-side processing is temporary and immediately discarded</li>
              <li><strong>No Third-Party Sharing:</strong> We do not share your data with third parties</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Cookies and Tracking</h2>
            <p className="mb-4 leading-relaxed">
              We use minimal tracking technologies:
            </p>
            <ul className="list-disc list-inside mb-4 space-y-2">
              <li><strong>Essential Cookies:</strong> Only necessary cookies for site functionality</li>
              <li><strong>No Analytics Cookies:</strong> We do not use Google Analytics or similar tracking</li>
              <li><strong>No Advertising Cookies:</strong> We do not serve ads or use advertising cookies</li>
              <li><strong>Local Storage:</strong> May store preferences locally in your browser</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Data Security</h2>
            <p className="mb-4 leading-relaxed">
              We implement security measures to protect our service:
            </p>
            <ul className="list-disc list-inside mb-4 space-y-2">
              <li><strong>HTTPS Encryption:</strong> All communications are encrypted</li>
              <li><strong>Secure Infrastructure:</strong> Hosted on secure, reputable platforms</li>
              <li><strong>Regular Updates:</strong> Security patches and updates are applied promptly</li>
              <li><strong>No Data Retention:</strong> No sensitive data is stored long-term</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Third-Party Services</h2>
            <p className="mb-4 leading-relaxed">
              Our service may interact with:
            </p>
            <ul className="list-disc list-inside mb-4 space-y-2">
              <li><strong>RedGifs Platform:</strong> To fetch content metadata (subject to their privacy policy)</li>
              <li><strong>CDN Services:</strong> For fast content delivery (no personal data shared)</li>
              <li><strong>Hosting Providers:</strong> For service infrastructure (standard server logs only)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Your Rights</h2>
            <p className="mb-4 leading-relaxed">
              Since we collect minimal data, your rights include:
            </p>
            <ul className="list-disc list-inside mb-4 space-y-2">
              <li><strong>Anonymity:</strong> Use our service without providing personal information</li>
              <li><strong>No Tracking:</strong> We do not build profiles or track your behavior</li>
              <li><strong>Data Portability:</strong> Not applicable as we don&apos;t store personal data</li>
              <li><strong>Right to Deletion:</strong> Not applicable as we don&apos;t retain personal data</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Children&apos;s Privacy</h2>
            <p className="mb-4 leading-relaxed">
              Our service is not directed to children under 13. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. International Users</h2>
            <p className="mb-4 leading-relaxed">
              Our service is available globally. By using our service, you consent to the processing of your data in accordance with this privacy policy, regardless of your location.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Changes to Privacy Policy</h2>
            <p className="mb-4 leading-relaxed">
              We may update this privacy policy from time to time. Changes will be posted on this page with an updated revision date. Your continued use of the service constitutes acceptance of the updated policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Data Retention</h2>
            <p className="mb-4 leading-relaxed">
              We follow a strict no-retention policy:
            </p>
            <ul className="list-disc list-inside mb-4 space-y-2">
              <li><strong>URLs:</strong> Not stored or logged</li>
              <li><strong>Downloaded Content:</strong> Not stored on our servers</li>
              <li><strong>User Sessions:</strong> Not tracked or stored</li>
              <li><strong>Server Logs:</strong> Automatically purged after 30 days</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Contact Us</h2>
            <p className="mb-4 leading-relaxed">
              If you have questions about this privacy policy or our privacy practices, please contact us through our FAQ page or support channels. We are committed to addressing your privacy concerns promptly.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
