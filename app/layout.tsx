import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { ClerkProvider } from "@clerk/nextjs";
import { ConsoleBrand } from "./components/ConsoleBrand";
import { ThemeProvider } from "./components/ThemeProvider";
import { SunlitBackground } from "./components/SunlitBackground";
import { PostHogProvider } from "./providers";
import "./globals.css";

const GA_MEASUREMENT_ID = (process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-L9MNKF57XD").trim();

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SELVE Chat - Your AI Personality Guide",
  description: "Your personality framework assistant powered by SELVE. Get personalized insights based on your SELVE assessment results.",
  keywords: ["SELVE", "personality", "assessment", "chatbot", "AI", "self-discovery", "personal growth"],
  authors: [{ name: "SELVE" }],
  creator: "SELVE",
  publisher: "SELVE",
  metadataBase: new URL((process.env.NEXT_PUBLIC_CHATBOT_URL || "http://localhost:4000").trim()),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "SELVE Chat - Your AI Personality Guide",
    description: "Your personality framework assistant powered by SELVE. Get personalized insights based on your SELVE assessment results.",
    siteName: "SELVE Chat",
  },
  twitter: {
    card: "summary_large_image",
    title: "SELVE Chat - Your AI Personality Guide",
    description: "Your personality framework assistant powered by SELVE. Get personalized insights based on your SELVE assessment results.",
    creator: "@SELVE",
  },
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/logo/selve-chat-logo.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/logo/selve-chat-logo.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          <link rel="icon" href="/favicon.ico" sizes="any" />
          <link rel="apple-touch-icon" href="/logo/selve-chat-logo.png" />
          <meta name="theme-color" content="#de6b35" />
        </head>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased text-zinc-900 dark:text-white min-h-screen`}
        >
          {/* Google Analytics */}
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            strategy="afterInteractive"
          />
          <Script
            id="google-analytics"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_MEASUREMENT_ID}');
              `,
            }}
          />

          <PostHogProvider>
            <ThemeProvider>
              <SunlitBackground />
              <ConsoleBrand>{children}</ConsoleBrand>
            </ThemeProvider>
          </PostHogProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
