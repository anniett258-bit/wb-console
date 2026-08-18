'use client';

import { Suspense, useMemo, useState, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { rechargeRecords, redeemRecords, usageRecords, methodNames, lineNames } from '@/lib/data';

const tabs = [
  { key: 'recharge', label: '充值记录' },
  { key: 'redeem', label: '兑换记录' },
  { key: 'usage', label: '使用记录' },
];

const validKeys = new Set(tabs.map((t) => t.key));

function RecordsContent() {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const raw = sp.get('tab') || 'recharge';
  const tab = validKeys.has(raw) ? raw : 'recharge';
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const switchTab = (key: string) => {
    router.push(`${pathname}?tab=${key}`);
  };

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setRefreshKey((k) => k + 1);
    // 模拟网络请求，800ms 后完成
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  return (
    <div className="space-y-6" key={refreshKey}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="wb-h1">记录</h1>
          <p className="wb-sub">查看你的充值、兑换与 API 调用明细。</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          title="刷新当前记录"
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-[var(--primary-lighter)] rounded-md text-[var(--muted)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-colors disabled:opacity-60"
        >
          <svg
            className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 12a9 9 0 1 1-3-6.7" />
            <polyline points="21 4 21 10 15 10" />
          </svg>
          <span>{refreshing ? '刷新中…' : '刷新'}</span>
        </button>
      </div>

      <div className="flex items-center gap-1 border-b border-gray-100">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => switchTab(t.key)}
            className={`px-4 py-2 text-sm border-b-2 -mb-px transition-colors ${tab === t.key ? 'border-[var(--primary)] text-[var(--primary)] font-medium' : 'border-transparent text-[var(--muted)] hover:text-[var(--foreground)]'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'recharge' && <RechargeTab />}
      {tab === 'redeem' && <RedeemTab />}
      {tab === 'usage' && <UsageTab />}
    </div>
  );
}

export default function RecordsPage() {
  return (
    <Suspense fallback={<div className="text-[var(--muted)] text-sm">加载中…</div>}>
      <RecordsContent />
    </Suspense>
  );
}

function RechargeTab() {
  return (
    <div className="wb-card !p-0 overflow-hidden">
      <table className="wb-table">
        <thead>
          <tr><th>时间</th><th>金额</th><th>方式</th><th>订单号</th></tr>
        </thead>
        <tbody>
          {rechargeRecords.map((r) => (
            <tr key={r.id}>
              <td className="text-[var(--muted)] whitespace-nowrap">{r.createdAt}</td>
              <td className="font-medium text-[var(--primary)]">+{r.amount.toLocaleString()} 积分</td>
              <td>{methodNames[r.method] || r.method}</td>
              <td className="font-mono text-xs text-[var(--muted)]">{r.orderId}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RedeemTab() {
  return (
    <div className="wb-card !p-0 overflow-hidden">
      <table className="wb-table">
        <thead>
          <tr><th>时间</th><th>兑换码</th><th>面值</th><th>操作人</th></tr>
        </thead>
        <tbody>
          {redeemRecords.map((r) => (
            <tr key={r.id}>
              <td className="text-[var(--muted)] whitespace-nowrap">{r.createdAt}</td>
              <td className="font-mono text-[var(--foreground)]">{r.code}</td>
              <td className="font-medium text-[var(--primary)]">+{r.amount.toLocaleString()} 积分</td>
              <td className="text-[var(--muted)]">{r.operator}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UsageTab() {
  const total = useMemo(() => usageRecords.reduce((s, r) => s + r.cost, 0), []);
  return (
    <div className="space-y-3">
      <div className="wb-card flex items-center justify-between">
        <div className="text-sm text-[var(--muted)]">本页累计消耗</div>
        <div className="text-lg font-semibold text-[var(--primary)]">{total} 积分 <span className="text-xs font-normal text-[var(--muted)]">约 ¥{(total * 0.001).toFixed(2)}</span></div>
      </div>
      <div className="wb-card !p-0 overflow-hidden">
        <table className="wb-table">
          <thead>
            <tr>
              <th>时间</th>
              <th>模型</th>
              <th>产品线</th>
              <th>输入 / 输出</th>
              <th>消耗</th>
              <th>API Key</th>
            </tr>
          </thead>
          <tbody>
            {usageRecords.map((r) => (
              <tr key={r.id}>
                <td className="text-[var(--muted)] whitespace-nowrap">{r.createdAt}</td>
                <td className="font-mono text-xs">{r.model}</td>
                <td><span className="wb-tag wb-tag-primary">{lineNames[r.line]}</span></td>
                <td className="text-[var(--muted)]">{r.inputTokens.toLocaleString()} / {r.outputTokens.toLocaleString()}</td>
                <td className="font-medium text-[var(--primary)]">{r.cost} 积分</td>
                <td className="font-mono text-xs text-[var(--muted)]">{r.key}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
