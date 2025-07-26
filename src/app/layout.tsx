import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import LayoutWithSidebar from "./LayoutWithSidebar";

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
  description: "پلتفرم اجتماعی Vista",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 dark:bg-zinc-950`}>
        <LayoutWithSidebar>{children}</LayoutWithSidebar>
      </body>
    </html>
  );
}
