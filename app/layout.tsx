import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppAuthUIProvider } from "@/components/auth/AuthUIProvider";
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
  title: "Cycle Weight Tracker",
  description: "Track weight against estimated cycle phases.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <AppAuthUIProvider>{children}</AppAuthUIProvider>
      </body>
    </html>
  );
}
