import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";

export const metadata: Metadata = {
  title: "阿彤木很酷 · 积分服务控制台",
  description: "阿彤木很酷积分服务控制台 — 一站式模型调用、余额管理、API配置",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        <div className="min-h-screen bg-white">
          <Sidebar />
          <TopBar />
          <main className="lg:ml-60 pt-14 lg:pt-0 min-h-screen">
            <div className="max-w-6xl mx-auto px-6 py-8">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
