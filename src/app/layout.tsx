// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SydeKick",
  description: "The SYDE Companion App",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // PURE SHELL - No logic here
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#111] text-gray-200`}>
        {children}
        <Toaster position="top-right" theme="dark" />
      </body>
    </html>
  );
}