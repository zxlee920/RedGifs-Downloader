import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { ThemeProvider } from "@/components/theme-provider";
import { siteConfig } from "@/config/site";
import { analyticsConfig, getGoogleAnalyticsScript, getMicrosoftClarityScript, getMicrosoftWebmasterMeta } from "@/config/analytics";
import Script from "next/script";

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  preload: false
});

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
  // verification: {
  //   google: 'your-google-verification-code', // 需要时添加
  // },
  other: {
    'msvalidate.01': getMicrosoftWebmasterMeta()?.content || '',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaScript = getGoogleAnalyticsScript()
  const clarityScript = getMicrosoftClarityScript()
  const webmasterMeta = getMicrosoftWebmasterMeta()

  return (
    <html lang="en" className="scroll-smooth" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        {webmasterMeta && (
          <meta name={webmasterMeta.name} content={webmasterMeta.content} />
        )}
      </head>
      <body className={`${inter.className} antialiased min-h-screen flex flex-col`} suppressHydrationWarning>
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
        
        {/* Google Analytics */}
        {gaScript && (
          <>
            <Script
              src={gaScript.src}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {gaScript.innerHTML}
            </Script>
          </>
        )}
        
        {/* Microsoft Clarity */}
        {clarityScript && (
          <Script id="microsoft-clarity" strategy="afterInteractive">
            {clarityScript}
          </Script>
        )}
      </body>
    </html>
  );
}
