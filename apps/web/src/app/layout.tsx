import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";

import ConvexClientProvider from "~/components/ConvexClientProvider";
import ClientLayout from "./ClientLayout";

import "./globals.css";

import type { Metadata } from "next";
import { Geist, Source_Code_Pro, Syne } from "next/font/google";

import { env } from "~/env";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["700", "800"],
  display: "swap",
});

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const sourceCodePro = Source_Code_Pro({
  variable: "--font-source-code-pro",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hypershelf",
  metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL ?? "https://hypershelf.app"),
  description: "Hypershelf - digital assets inventory",
  openGraph: {
    title: "Hypershelf",
    description: "Hypershelf - digital assets inventory",
    type: "website",
    images: [
      {
        url: "/meta/og-image.png",
      },
    ],
  },
  twitter: {
    title: "Hypershelf",
    description: "Hypershelf - digital assets inventory",
    card: "summary_large_image",
    images: ["/meta/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/meta/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/meta/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: [{ url: "/meta/favicon.ico" }],
    apple: [{ url: "/meta/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/meta/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ConvexAuthNextjsServerProvider>
      <html lang="en">
        <body
          className={`${syne.variable} ${geist.variable} ${sourceCodePro.variable} bg-background font-sans antialiased`}
        >
          <ConvexClientProvider>
            <ClientLayout>{children}</ClientLayout>
          </ConvexClientProvider>
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  );
}
