'use client';

import { useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { currentUser } from '@/lib/data';
import { useBalance } from '@/lib/useBalance';

// TDesign 风格线性 icon（纯 SVG，stroke=1.5）
const Icon = {
  // === Logo: Pay 字母变形 — P 形外框 + 积分点 ===
  // 外圈取 P 形（圆 + 一根下垂的竖），内嵌 + 隐喻「支付 / 积分」
  Logo: () => (
    <svg viewBox="0 0 32 32" width="32" height="32" fill="none" aria-hidden>
      <defs>
        <linearGradient id="wbLogo" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffa153" />
          <stop offset="1" stopColor="#e5832b" />
        </linearGradient>
      </defs>
      <path
        d="M16 2a14 14 0 1 1 0 28 14 14 0 0 1 0-28Z"
        fill="url(#wbLogo)"
      />
      {/* P 字母的「肚子」 + 竖 */}
      <path
        d="M12 9h5.5a3.7 3.7 0 0 1 0 7.4H12V9Z M12 16.4V22"
        stroke="#fff"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* 右上角积分 + 小标记（呼应 Pay 收银的圆点感） */}
      <circle cx="22.5" cy="9.5" r="2.4" fill="#fff" />
      <path d="M21.4 9.5h2.2M22.5 8.4v2.2" stroke="#ffa153" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
  Dashboard: () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  ),
  Chat: () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 0 1-4-.8L3 20l1.4-3.6A7.7 7.7 0 0 1 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8Z" />
    </svg>
  ),
  Record: () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M8 9h8M8 13h8M8 17h5" />
    </svg>
  ),
  Code: () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m8 8-5 4 5 4M16 8l5 4-5 4M14 4l-4 16" />
    </svg>
  ),
  Service: () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 0 1 18 0v3a2 2 0 0 1-2 2h-1v-6h3M3 12v3a2 2 0 0 0 2 2h1v-6H3" />
    </svg>
  ),
  Chevron: ({ open }: { open: boolean }) => (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform 150ms', transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  ),
  Close: () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  ),
};

type SubItem = { label: string; path: string };
type NavItem = {
  key: string;
  label: string;
  icon: React.FC;
  path?: string;
  children?: SubItem[];
  action?: 'open-service';
};

const navConfig: NavItem[] = [
  { key: 'dashboard', label: '控制台', icon: Icon.Dashboard, path: '/dashboard' },
  { key: 'wb', label: 'WorkBuddy', icon: Icon.Chat, path: '/models/workbuddy' },
  { key: 'cb', label: 'CodeBuddy', icon: Icon.Code, path: '/models/codebuddy' },
  { key: 'faq', label: '常见问题', icon: Icon.Chat, path: '/faq' },
  {
    key: 'records',
    label: '记录管理',
    icon: Icon.Record,
    children: [
      { label: '充值记录', path: '/records?tab=recharge' },
      { label: '兑换记录', path: '/records?tab=redeem' },
      { label: '使用记录', path: '/records?tab=usage' },
    ],
  },
  { key: 'service', label: '联系在线客服', icon: Icon.Service, action: 'open-service' as const },
];

export default function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const balance = useBalance();
  const [open, setOpen] = useState<Record<string, boolean>>({
    faq: pathname.startsWith('/faq'),
    records: pathname.startsWith('/records'),
  });
  const [accountOpen, setAccountOpen] = useState(false);
  const [serviceOpen, setServiceOpen] = useState(false);

  const isActive = (item: NavItem): boolean => {
    if (item.path) return pathname === item.path || pathname.startsWith(item.path + '/');
    if (item.children) {
      return item.children.some((c) => {
        const url = new URL(c.path, 'http://x');
        return pathname === url.pathname;
      });
    }
    return false;
  };

  const handleNav = (item: NavItem) => {
    if (item.children) {
      setOpen((p) => ({ ...p, [item.key]: !p[item.key] }));
    } else if ((item as any).action === 'open-service') {
      setServiceOpen(true);
    } else if (item.path) {
      router.push(item.path);
    }
  };

  // 暴露全局入口：让 FAQ 页面按钮也能调起客服弹窗
  if (typeof window !== 'undefined') {
    (window as any).__openService = () => setServiceOpen(true);
  }

  return (
    <>
      {/* === Mobile Header === */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-[#ffe8d4] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[var(--foreground)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/product-logo.png" alt="WorkBuddy" className="w-7 h-7 rounded-md object-cover" />
          <span className="font-semibold text-sm">WorkBuddy 积分服务</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs px-2 py-1 rounded-md bg-[var(--primary-light)] text-[var(--primary)] border border-[var(--primary-lighter)] font-medium">
            积分 {balance.toLocaleString()}
          </span>
          <button
            onClick={() => {
              document.getElementById('mobile-overlay')?.classList.remove('hidden');
              document.getElementById('mobile-sidebar')?.classList.remove('-translate-x-full');
            }}
            className="text-[var(--primary)]"
            aria-label="菜单"
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
        </div>
      </div>

      <div
        id="mobile-overlay"
        className="hidden fixed inset-0 z-50 bg-black/30 lg:hidden"
        onClick={() => {
          document.getElementById('mobile-overlay')?.classList.add('hidden');
          document.getElementById('mobile-sidebar')?.classList.add('-translate-x-full');
        }}
      />

      <div
        id="mobile-sidebar"
        className="fixed left-0 top-0 bottom-0 z-50 w-64 bg-white shadow-lg -translate-x-full transition-transform duration-200 lg:hidden overflow-y-auto"
      >
        <SidebarContent
          pathname={pathname}
          searchParams={searchParams}
          router={router}
          balance={balance}
          open={open}
          setOpen={setOpen}
          accountOpen={accountOpen}
          setAccountOpen={setAccountOpen}
          serviceOpen={serviceOpen}
          setServiceOpen={setServiceOpen}
          isMobile
        />
      </div>

      {/* === Desktop Sidebar === */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-60 bg-white border-r border-[#ffe8d4] z-30">
        <SidebarContent
          pathname={pathname}
          searchParams={searchParams}
          router={router}
          balance={balance}
          open={open}
          setOpen={setOpen}
          accountOpen={accountOpen}
          setAccountOpen={setAccountOpen}
          serviceOpen={serviceOpen}
          setServiceOpen={setServiceOpen}
        />
      </aside>

      {/* === 联系在线客服弹窗 === */}
      {serviceOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4"
          onClick={() => setServiceOpen(false)}
        >
          <div
            className="relative bg-white rounded-xl p-6 w-[320px] max-w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setServiceOpen(false)}
              className="absolute top-3 right-3 w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center text-[var(--muted)]"
              aria-label="关闭"
            >
              <Icon.Close />
            </button>
            <div className="text-center font-medium text-[var(--foreground)] mb-4">联系在线客服</div>
            <div className="flex justify-center mb-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/qrcode.jpg" alt="客服二维码" className="w-52 h-52 rounded-md border border-[#ffe8d4]" />
            </div>
            <p className="text-center text-sm text-[var(--muted)]">扫码加好友在线答疑</p>
          </div>
        </div>
      )}
    </>
  );
}

function SidebarContent({
  pathname,
  searchParams,
  router,
  balance,
  open,
  setOpen,
  accountOpen,
  setAccountOpen,
  serviceOpen,
  setServiceOpen,
  isMobile = false,
}: {
  pathname: string;
  searchParams: URLSearchParams;
  router: ReturnType<typeof useRouter>;
  balance: number;
  open: Record<string, boolean>;
  setOpen: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  accountOpen: boolean;
  setAccountOpen: React.Dispatch<React.SetStateAction<boolean>>;
  serviceOpen: boolean;
  setServiceOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isMobile?: boolean;
}) {
  const isActive = (item: NavItem): boolean => {
    if (item.path) return pathname === item.path || pathname.startsWith(item.path + '/');
    if (item.children) {
      return item.children.some((c) => {
        const url = new URL(c.path, 'http://x');
        return pathname === url.pathname;
      });
    }
    return false;
  };

  const handleNav = (item: NavItem) => {
    if (item.children) {
      setOpen((p) => ({ ...p, [item.key]: !p[item.key] }));
    } else if ((item as any).action === 'open-service') {
      setServiceOpen(true);
    } else if (item.path) {
      router.push(item.path);
      if (isMobile) {
        document.getElementById('mobile-overlay')?.classList.add('hidden');
        document.getElementById('mobile-sidebar')?.classList.add('-translate-x-full');
      }
    }
  };

  const closeMobile = () => {
    if (!isMobile) return;
    document.getElementById('mobile-overlay')?.classList.add('hidden');
    document.getElementById('mobile-sidebar')?.classList.add('-translate-x-full');
  };

  return (
    <>
      {/* Logo — 产品图 + 文字标识 */}
      <div className="px-4 py-4 border-b border-[#ffe8d4]">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/product-logo.png" alt="WorkBuddy" className="w-9 h-9 rounded-md object-cover flex-shrink-0" />
          <div className="min-w-0">
            <div className="text-sm font-semibold text-[var(--foreground)] leading-tight truncate">WorkBuddy</div>
            <div className="text-[11px] text-[var(--muted)] leading-tight truncate">积分服务控制台</div>
          </div>
        </div>
      </div>

      {/* 积分余额卡（橙色主调 - 浅渐变） */}
      <div className="px-4 pt-4">
        <div
          className="rounded-lg p-3 text-white relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #ffc28a 0%, #ffa153 100%)' }}
        >
          <div className="text-[11px] opacity-90 mb-0.5">积分余额</div>
          <div className="text-2xl font-bold tracking-tight">
            {balance.toLocaleString()}
          </div>
          <button
            onClick={() => { router.push('/recharge'); closeMobile(); }}
            className="mt-2 w-full text-[12px] py-1.5 rounded-md bg-white/95 hover:bg-white text-[var(--primary)] font-medium transition-colors"
          >
            立即充值
          </button>
        </div>
      </div>

      {/* 导航 */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto">
        {navConfig.map((item) => {
          const active = isActive(item);
          const hasChildren = !!item.children;
          const isOpen = !!open[item.key];
          const IconComp = item.icon;

          return (
            <div key={item.key} className="mb-0.5">
              <button
                onClick={() => handleNav(item)}
                className={`wb-nav-item ${active ? 'is-active' : ''}`}
              >
                <span className="wb-nav-icon"><IconComp /></span>
                <span className="flex-1">{item.label}</span>
                {hasChildren && (
                  <span className="text-[#9ca3af]"><Icon.Chevron open={isOpen} /></span>
                )}
              </button>

              {hasChildren && isOpen && (
                <div className="wb-nav-children">
                  {item.children!.map((c) => {
                    const url = new URL(c.path, 'http://x');
                    // 精准匹配：pathname 相同 + search 参数也必须全部相同
                    const samePath = pathname === url.pathname;
                    const targetQuery = Object.fromEntries(url.searchParams.entries());
                    const currentQuery = Object.fromEntries(searchParams.entries());
                    const sameQuery = Object.keys(targetQuery).every(
                      (k) => targetQuery[k] === currentQuery[k]
                    );
                    const childActive = samePath && sameQuery;
                    return (
                      <button
                        key={c.path}
                        onClick={() => { router.push(c.path); closeMobile(); }}
                        className={`wb-nav-child ${childActive ? 'is-active' : ''}`}
                      >
                        {c.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* 账号区 */}
      <div className="p-3 border-t border-[#ffe8d4] relative">
        <button
          onClick={() => setAccountOpen((v) => !v)}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md hover:bg-[var(--primary-light)] transition-colors"
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium"
            style={{ background: 'var(--primary)' }}
          >
            {currentUser.nickname[0]}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <div className="text-sm font-medium text-[var(--foreground)] truncate">{currentUser.nickname}</div>
            <div className="text-[11px] text-[var(--muted)]">{currentUser.id}</div>
          </div>
          <span
            className="text-[var(--muted)]"
            style={{ transform: accountOpen ? 'rotate(90deg)' : 'none', transition: 'transform 150ms' }}
          >
            <Icon.Chevron open={accountOpen} />
          </span>
        </button>
        {accountOpen && (
          <div className="absolute left-3 right-3 bottom-14 bg-white border border-[#ffe8d4] rounded-md shadow-lg py-1 text-sm z-10">
            <button onClick={() => { setAccountOpen(false); router.push('/dashboard'); closeMobile(); }} className="w-full text-left px-3 py-2 hover:bg-[var(--primary-light)] text-[var(--foreground)]">账号信息</button>
            <button onClick={() => { setAccountOpen(false); router.push('/records?tab=usage'); closeMobile(); }} className="w-full text-left px-3 py-2 hover:bg-[var(--primary-light)] text-[var(--foreground)]">用量明细</button>
            <button onClick={() => { setAccountOpen(false); router.push('/recharge'); closeMobile(); }} className="w-full text-left px-3 py-2 hover:bg-[var(--primary-light)] text-[var(--foreground)]">充值中心</button>
            <button onClick={() => { setAccountOpen(false); router.push('/redeem'); closeMobile(); }} className="w-full text-left px-3 py-2 hover:bg-[var(--primary-light)] text-[var(--foreground)]">兑换中心</button>
            <div className="my-1 border-t border-[#ffe8d4]" />
            <button onClick={() => { setAccountOpen(false); router.push('/login'); }} className="w-full text-left px-3 py-2 hover:bg-[var(--primary-light)] text-[var(--primary)]">退出登录</button>
          </div>
        )}
      </div>
    </>
  );
}
