import { Suspense } from "react";
import { Figtree, Fraunces } from "next/font/google";
import type { Metadata } from "next";
import "./globals.css";

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
});

export const metadata: Metadata = {
  title: "Atrium — Society Maintenance Tracker",
  description: "Track society complaints, notices, and maintenance SLAs.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${figtree.variable} ${fraunces.variable} ${figtree.className} antialiased`}>
        <Suspense>{children}</Suspense>
      </body>
    </html>
  );
}
