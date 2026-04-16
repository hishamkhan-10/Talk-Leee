import type { Metadata, Viewport } from "next";
import { Inter, Manrope, Orbitron } from "next/font/google";
import "./globals.css";
import { SuspensionStateProvider } from "@/components/admin/suspension-state-provider";
import { AppProviders } from "@/components/providers/app-providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
});

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
});

export const metadata: Metadata = {
  title: "Talk-Lee",
  description: "Intelligent voice communication platform powered by advanced AI agents",
  manifest: "/site.webmanifest",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try { document.documentElement.classList.add(localStorage.getItem('talklee.theme') || 'light') } catch(e) {}`,
          }}
        />
        <link rel="preload" as="video" href="/images/ai-voice-section..mp4" />
      </head>
      <body className={`${inter.variable} ${manrope.variable} ${orbitron.variable} font-sans antialiased`}>
        <AppProviders>
          <SuspensionStateProvider>
            {children}
          </SuspensionStateProvider>
        </AppProviders>
      </body>
    </html>
  );
}
