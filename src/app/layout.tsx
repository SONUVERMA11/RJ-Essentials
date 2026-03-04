import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import AuthSessionProvider from "@/components/AuthSessionProvider";

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-geist-sans',
});

export const metadata: Metadata = {
  title: "RJ ESSENTIALS — Quality at Your Doorstep",
  description: "Shop quality products at RJ ESSENTIALS. Best prices on Electronics, Fashion, Home & Kitchen, Beauty and more. Cash on Delivery available across India.",
  keywords: "online shopping, COD, cash on delivery, electronics, fashion, India",
  openGraph: {
    title: "RJ ESSENTIALS — Quality at Your Doorstep",
    description: "Shop quality products at affordable prices. COD available across India.",
    type: "website",
    siteName: "RJ ESSENTIALS",
  },
  icons: { icon: '/icon.svg' },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased bg-background text-foreground transition-colors`}>
        <AuthSessionProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </AuthSessionProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',()=>{navigator.serviceWorker.register('/sw.js')})}`
          }}
        />
      </body>
    </html>
  );
}
