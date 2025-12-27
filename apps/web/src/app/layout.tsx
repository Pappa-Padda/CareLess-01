
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CAReLESS",
  description: "Organize event lifts efficiently",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-48x48.jpg",
    apple: "/icons/icon-192x192.jpg",
  },
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
