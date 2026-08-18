'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';

export default function TopBar() {
  const pathname = usePathname();
  const [showQR, setShowQR] = useState(false);

  // 登录页不显示顶栏
  if (pathname === '/login') return null;

  return (
    <>
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-100 z-20 flex items-center px-4">
        <div className="text-base font-semibold text-[var(--foreground)]">阿彤木很酷</div>
        <div className="ml-auto" />
      </header>

      <div className="hidden lg:block fixed top-4 right-6 z-30">
        <button
          onClick={() => setShowQR(true)}
          className="flex items-center gap-2 px-3 h-9 rounded-full bg-white border border-[var(--primary-lighter)] hover:border-[var(--primary)] shadow-sm transition-colors group"
        >
          <span className="w-2 h-2 rounded-full bg-[var(--primary)] group-hover:scale-125 transition-transform" />
          <span className="text-sm text-[var(--foreground)]">关注公众号</span>
          <span className="text-xs text-[var(--muted)]">阿彤木很酷</span>
        </button>
      </div>

      {showQR && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4"
          onClick={() => setShowQR(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-xs w-full text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-sm font-semibold text-[var(--foreground)]">关注公众号</div>
            <div className="text-xs text-[var(--muted)] mt-1">活动码 / 兑换码首发渠道</div>
            <div className="mt-4 aspect-square bg-white rounded-lg overflow-hidden border border-gray-100 p-2">
              <img src="/images/wx-public-qr.jpg" alt="公众号二维码" className="w-full h-full object-contain" />
            </div>
            <div className="mt-3 text-base font-medium text-[var(--foreground)]">阿彤木很酷</div>
            <div className="text-xs text-[var(--muted)] mt-0.5">微信扫码即可关注</div>
            <button
              onClick={() => setShowQR(false)}
              className="mt-4 w-full h-9 rounded-lg border border-gray-200 text-sm text-[var(--foreground)] hover:bg-gray-50"
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </>
  );
}
