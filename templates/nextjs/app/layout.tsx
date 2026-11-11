import {Geist, Geist_Mono} from "next/font/google";
import type {Metadata} from "next";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Next.js application",
  description: "A Next.js application.",
};

export default function RootLayout(props: LayoutProps<"/">) {
  const {children} = props;

  return (
    <html className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`} lang="en">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
