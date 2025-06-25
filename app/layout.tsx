/*
https://github.com/hikariatama/hypershelf
Copyright (C) 2025  Daniil Gazizullin

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/
import ConvexClientProvider from "@/components/ConvexClientProvider";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import type { Metadata } from "next";
import {
  Space_Grotesk,
  Space_Mono,
  Syne,
  Inter,
  Source_Code_Pro
} from "next/font/google";
import ClientLayout from "./ClientLayout";
import "./globals.css";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["700", "800"],
  display: "swap"
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap"
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap"
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap"
});

const sourceCodePro = Source_Code_Pro({
  variable: "--font-source-code-pro",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap"
});

export const metadata: Metadata = {
  title: "Hypershelf",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://hypershelf.dgazizullin.dev"
  ),
  description: "Hypershelf - digital assets inventory",
  openGraph: {
    title: "Hypershelf",
    description: "Hypershelf - digital assets inventory",
    type: "website",
    images: [
      {
        url: "/meta/og-image.png"
      }
    ]
  },
  twitter: {
    title: "Hypershelf",
    description: "Hypershelf - digital assets inventory",
    card: "summary_large_image",
    images: ["/meta/og-image.png"]
  },
  icons: {
    icon: [
      { url: "/meta/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/meta/favicon.svg", type: "image/svg+xml" }
    ],
    shortcut: [{ url: "/meta/favicon.ico" }],
    apple: [{ url: "/meta/apple-touch-icon.png", sizes: "180x180" }]
  },
  manifest: "/meta/site.webmanifest"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ConvexAuthNextjsServerProvider>
      <html lang="en">
        <body
          className={`${syne.variable} ${spaceGrotesk.variable} ${spaceMono.variable} ${inter.variable} ${sourceCodePro.variable} bg-background font-sans antialiased`}
        >
          <ConvexClientProvider>
            <ClientLayout>{children}</ClientLayout>
          </ConvexClientProvider>
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  );
}
