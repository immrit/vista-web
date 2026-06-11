import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import LayoutWithSidebar from "./LayoutWithSidebar";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { GlobalMiniPlayer } from "@/components/ui/GlobalMiniPlayer";
import { Toaster } from 'sonner';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vista Web",
  description: "پلتفرم اجتماعی Vista برای اشتراک‌گذاری محتوا",
  keywords: ["vista", "social", "media", "پلتفرم", "اجتماعی", "اشتراک", "شبکه اجتماعی ویستا", "ویستا"],
  authors: [{ name: "Vista Team" }],
  creator: "Vista Team",
  publisher: "Vista",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://cafevista.ir'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "Vista - پلتفرم اجتماعی",
    description: "پلتفرم اجتماعی Vista برای اشتراک‌گذاری محتوا",
    url: 'https://cafevista.ir',
    siteName: 'Vista',
    locale: 'fa_IR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Vista - پلتفرم اجتماعی",
    description: "پلتفرم اجتماعی Vista برای اشتراک‌گذاری محتوا",
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
    <html lang="fa" dir="rtl">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="application-name" content="Vista" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Vista" />
        <meta name="description" content="پلتفرم اجتماعی Vista برای اشتراک‌گذاری محتوا" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#3b82f6" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="theme-color" content="#3b82f6" />

        <link rel="apple-touch-icon" href="/favicon.ico" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="shortcut icon" href="/favicon.ico" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 dark:bg-zinc-950`}>
        <QueryProvider>
          <LayoutWithSidebar>{children}</LayoutWithSidebar>
          <GlobalMiniPlayer />
          <Toaster position="top-center" richColors />
        </QueryProvider>
      </body>
    </html>
  );
}
