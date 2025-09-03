import type { Metadata } from "next";
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import Navigation from '@/components/navigation'
import Footer from '@/components/footer'
import { siteConfig } from '@/config/site'
import Analytics from '@/components/analytics';
import HydrationFix from '@/components/hydration-fix';


export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.baseUrl),
  title: siteConfig.title,
  description: siteConfig.description,
  authors: [{ name: siteConfig.author }],
  openGraph: {
    title: siteConfig.title,
    description: siteConfig.description,
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en" className="scroll-smooth" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <style dangerouslySetInnerHTML={{
          __html: `
            html { visibility: hidden; }
            html.hydrated { visibility: visible; }
          `
        }} />
        {/* Analytics Scripts in Head */}
        <Analytics />
      </head>
      <body className="antialiased min-h-screen flex flex-col" suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Navigation />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </ThemeProvider>
        
        <HydrationFix />
      </body>
    </html>
  );
}
