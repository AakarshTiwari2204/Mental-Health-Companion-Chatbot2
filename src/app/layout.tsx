import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MindWell Companion - Student Mental Health Support",
  description: "A supportive digital companion for student mental well-being. Get empathetic support, stress management tips, and coping strategies for academic life.",
  keywords: ["mental health", "student wellness", "stress relief", "anxiety support", "college mental health", "emotional support", "wellness companion"],
  authors: [{ name: "Aakarsh Tiwari" }],
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "MindWell Companion",
    description: "Your supportive wellness partner for student mental health",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MindWell Companion",
    description: "Your supportive wellness partner for student mental health",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
