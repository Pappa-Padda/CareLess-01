
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MySQL CareLess PWA",
  description: "Built with Next.js and TiDB",
  manifest: "/manifest.json", // <-- This links the manifest file
};

export const viewport: Viewport = {
  themeColor: "#000000", // <-- Sets the browser bar color on mobile
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={inter.className}>{children}
      </body>
    </html>
  );
}
