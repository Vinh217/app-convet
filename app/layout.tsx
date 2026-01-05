import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Quản lý Truyện Convert",
  description: "Hệ thống crawl và dịch lại truyện convert bằng DeepSeek API",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="scroll-smooth h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-full debug-screens`}
      >
        <div className="flex w-full h-full bg-zinc-50 dark:bg-black">
          <Sidebar />
          <main className="flex-1 h-full overflow-y-auto w-full pt-16 lg:pt-0">
             <div className="max-w-7xl mx-auto p-4 lg:p-8">
              {children}
             </div>
          </main>
        </div>
      </body>
    </html>
  );
}
