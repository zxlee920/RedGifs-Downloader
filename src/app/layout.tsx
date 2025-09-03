import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  preload: false
});

export const metadata: Metadata = {
  metadataBase: new URL('https://redgifs-downloader.kasonleegm.workers.dev'),
  title: "RedGifs Downloader – Bulk download HD videos in seconds",
  description: "Stop wasting time &mdash; download RedGifs HD videos and cover images in seconds with our free online tool.",
  authors: [{ name: "RedGifs Downloader Team" }],
  openGraph: {
    title: "RedGifs Downloader – Bulk download HD videos in seconds",
    description: "Stop wasting time &mdash; download RedGifs HD videos and cover images in seconds with our free online tool.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "RedGifs Downloader – Bulk download HD videos in seconds",
    description: "Stop wasting time &mdash; download RedGifs HD videos and cover images in seconds with our free online tool.",
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
  verification: {
    google: 'your-google-verification-code',
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
      </body>
    </html>
  );
}
