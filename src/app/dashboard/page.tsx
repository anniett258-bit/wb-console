'use client';

import { useRouter } from 'next/navigation';
import { currentUser, models, usageRecords } from '@/lib/data';
import { useBalance } from '@/lib/useBalance';

export default function DashboardPage() {
  const router = useRouter();
  const balance = useBalance();
  const todayCost = usageRecords
    .filter((u) => u.createdAt.startsWith('2026-08-13'))
    .reduce((s, u) => s + u.cost, 0);
  const monthCost = usageRecords.reduce((s, u) => s + u.cost, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="wb-h1">控制台</h1>
        <p className="wb-sub">欢迎回来，{currentUser.nickname}。这是你最近的使用概览。</p>
      </div>

      {/* 数据卡 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="wb-card">
          <div className="text-xs text-[var(--muted)]">积分余额</div>
          <div className="text-2xl font-bold text-[var(--primary)] mt-1">{balance.toLocaleString()}</div>
          <button onClick={() => router.push('/recharge')} className="mt-2 text-xs text-[var(--primary)] hover:underline">立即充值 →</button>
        </div>
        <div className="wb-card">
          <div className="text-xs text-[var(--muted)]">今日消耗</div>
          <div className="text-2xl font-bold text-[var(--foreground)] mt-1">{todayCost} <span className="text-sm font-normal text-[var(--muted)]">积分</span></div>
          <div className="text-xs text-[var(--muted)] mt-1">约 ¥{(todayCost * 0.001).toFixed(2)}</div>
        </div>
        <div className="wb-card">
          <div className="text-xs text-[var(--muted)]">本月消耗</div>
          <div className="text-2xl font-bold text-[var(--foreground)] mt-1">{monthCost} <span className="text-sm font-normal text-[var(--muted)]">积分</span></div>
          <div className="text-xs text-[var(--muted)] mt-1">约 ¥{(monthCost * 0.001).toFixed(2)}</div>
        </div>
        <div className="wb-card">
          <div className="text-xs text-[var(--muted)]">累计调用</div>
          <div className="text-2xl font-bold text-[var(--foreground)] mt-1">{(currentUser.totalTokens / 1_000_000).toFixed(1)}M <span className="text-sm font-normal text-[var(--muted)]">tokens</span></div>
          <div className="text-xs text-[var(--muted)] mt-1">总支出 ¥{currentUser.totalSpent}</div>
        </div>
      </div>

      {/* 余额预警 */}
      {balance < 10000 && (
        <div className="border border-amber-200 bg-amber-50 rounded-lg p-4 flex items-start gap-3">
          <div className="w-5 h-5 rounded-full bg-amber-400 text-white flex items-center justify-center text-xs flex-shrink-0 mt-0.5">!</div>
          <div className="flex-1">
            <div className="text-sm font-medium text-amber-900">积分余额不足</div>
            <div className="text-xs text-amber-700 mt-0.5">当前余额 {balance.toLocaleString()}，低于预警阈值 10,000。建议及时充值，避免影响正常使用。</div>
          </div>
          <button onClick={() => router.push('/recharge')} className="wb-btn wb-btn-primary !h-8 text-xs">立即充值</button>
        </div>
      )}

      {/* 快捷操作 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button onClick={() => router.push('/models/workbuddy')} className="wb-card text-left hover:border-[var(--primary)] transition-colors group">
          <div className="text-sm font-medium text-[var(--foreground)] group-hover:text-[var(--primary)]">WorkBuddy 模型 →</div>
          <div className="text-xs text-[var(--muted)] mt-1">{models.filter((m) => m.line === 'workbuddy').length} 个模型可用，查看适合场景与价格</div>
        </button>
        <button onClick={() => router.push('/models/codebuddy')} className="wb-card text-left hover:border-[var(--primary)] transition-colors group">
          <div className="text-sm font-medium text-[var(--foreground)] group-hover:text-[var(--primary)]">CodeBuddy 模型 →</div>
          <div className="text-xs text-[var(--muted)] mt-1">{models.filter((m) => m.line === 'codebuddy').length} 个模型可用，IDE 代码补全</div>
        </button>
        <button onClick={() => router.push('/redeem')} className="wb-card text-left hover:border-[var(--primary)] transition-colors group">
          <div className="text-sm font-medium text-[var(--foreground)] group-hover:text-[var(--primary)]">兑换码充值 →</div>
          <div className="text-xs text-[var(--muted)] mt-1">公众号「阿彤木很酷」活动期间发放兑换码</div>
        </button>
      </div>

      {/* 最近调用 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="wb-h2">最近调用</h2>
          <button onClick={() => router.push('/records?tab=usage')} className="text-xs text-[var(--primary)] hover:underline">查看全部 →</button>
        </div>
        <div className="wb-card !p-0 overflow-hidden">
          <table className="wb-table">
            <thead>
              <tr>
                <th>时间</th>
                <th>模型</th>
                <th>输入 / 输出 tokens</th>
                <th>消耗</th>
                <th>API Key</th>
              </tr>
            </thead>
            <tbody>
              {usageRecords.slice(0, 5).map((r) => (
                <tr key={r.id}>
                  <td className="text-[var(--muted)] whitespace-nowrap">{r.createdAt}</td>
                  <td><span className="font-mono text-xs">{r.model}</span></td>
                  <td className="text-[var(--muted)]">{r.inputTokens.toLocaleString()} / {r.outputTokens.toLocaleString()}</td>
                  <td className="font-medium text-[var(--primary)]">{r.cost} 积分</td>
                  <td className="font-mono text-xs text-[var(--muted)]">{r.key}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
