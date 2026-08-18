'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { addBalance } from '@/lib/redeem';
import { useBalance } from '@/lib/useBalance';

type Plan = {
  key: string;
  name: string;
  price: number;
  baseCredits: number;
  bonus: number;
  badge?: string;
  desc: string;
};

const PLANS: Plan[] = [
  { key: 'trial', name: '体验包', price: 9.9, baseCredits: 4950, bonus: 0, desc: '尝鲜首选' },
  { key: 'starter', name: '尝鲜包', price: 29, baseCredits: 14500, bonus: 0, desc: '个人开发者' },
  { key: 'standard', name: '标准包', price: 99, baseCredits: 49500, bonus: 4950, badge: '推荐', desc: '小团队首选' },
  { key: 'business', name: '商务包', price: 299, baseCredits: 149500, bonus: 22425, desc: '高频调用' },
];

const RATIO = 500;

function formatNum(n: number) {
  return n.toLocaleString('zh-CN');
}

function WechatLogo() {
  return <img src="/images/wechat.svg" alt="微信支付" className="w-5 h-5 shrink-0" />;
}

function AlipayLogo() {
  return <img src="/images/alipay.svg" alt="支付宝" className="w-5 h-5 shrink-0" />;
}

export default function RechargePage() {
  const router = useRouter();
  const balance = useBalance();
  const [selected, setSelected] = useState<string>('standard');
  const [customAmount, setCustomAmount] = useState<string>('');
  const [useCustom, setUseCustom] = useState(false);
  const [payMethod, setPayMethod] = useState<'wechat' | 'alipay'>('wechat');
  const [showQR, setShowQR] = useState(false);
  const [paid, setPaid] = useState<{ total: number; newBalance: number; name: string; price: number } | null>(null);

  const customNum = parseFloat(customAmount);
  const customValid = !isNaN(customNum) && customNum >= 1 && customNum <= 99999;

  const summary = useMemo(() => {
    if (useCustom && customValid) {
      const base = Math.floor(customNum * RATIO);
      return { name: '自定义', price: customNum, credits: base, bonus: 0, total: base, isCustom: true };
    }
    const p = PLANS.find((x) => x.key === selected)!;
    return { name: p.name, price: p.price, credits: p.baseCredits, bonus: p.bonus, total: p.baseCredits + p.bonus, isCustom: false };
  }, [useCustom, customValid, customNum, selected]);

  const handlePay = () => {
    if (useCustom && !customValid) return;
    setShowQR(true);
  };

  const handleConfirmPaid = () => {
    // 真实到账：写余额 + 触发全局 balance 事件
    const newBalance = addBalance(summary.total);
    setPaid({ total: summary.total, newBalance, name: summary.name, price: summary.price });
    setShowQR(false);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="wb-h1">充值中心</h1>
        <p className="wb-sub">1 元 = {RATIO} 积分 · 充值后实时到账，长期有效</p>
      </div>

      {/* 当前余额卡片 — 填色 */}
      <div
        className="flex items-center justify-between px-5 py-4 rounded-xl text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #ffb878 0%, #ffa153 55%, #e5832b 100%)' }}
      >
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10" />
        <div className="absolute -right-4 -bottom-12 w-24 h-24 rounded-full bg-white/8" />
        <div className="relative">
          <div className="text-xs text-white/80">当前积分余额</div>
          <div className="text-3xl font-bold mt-0.5">{balance.toLocaleString('en-US')}</div>
        </div>
        <div className="relative text-xs text-right text-white/85 space-y-0.5">
          <div>累计充值 ¥437.9</div>
          <div>本年累计调用 12,840 次</div>
        </div>
      </div>

      {/* 套餐选择 + 自定义金额 合并 */}
      <div className="wb-card">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-medium text-[var(--foreground)]">选择套餐</div>
          <div className="text-xs text-[var(--muted)]">1 元 = {RATIO} 积分</div>
        </div>

        {/* 套餐卡片 — 角标非胶囊 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {PLANS.map((p) => {
            const isActive = !useCustom && selected === p.key;
            return (
              <button
                key={p.key}
                onClick={() => {
                  setSelected(p.key);
                  setUseCustom(false);
                }}
                className={`relative text-left p-3.5 rounded-lg border-2 transition-all ${
                  isActive
                    ? 'border-[var(--primary)] bg-[var(--primary-light)] shadow-sm'
                    : 'border-gray-100 hover:border-[var(--primary-lighter)] bg-white'
                }`}
              >
                {p.badge && (
                  <span
                    className="absolute -top-2 -right-2 text-[10px] font-semibold text-white px-2 py-0.5 rounded-sm"
                    style={{
                      background: 'linear-gradient(135deg, #ffa153 0%, #e5832b 100%)',
                      boxShadow: '0 2px 6px rgba(229,131,43,0.35)',
                    }}
                  >
                    {p.badge}
                  </span>
                )}
                <div className="flex items-baseline justify-between">
                  <div className="text-sm font-medium text-[var(--foreground)]">{p.name}</div>
                  <div className="text-base font-bold text-[var(--foreground)]">¥{p.price}</div>
                </div>
                <div className="text-[11px] text-[var(--muted)] mt-0.5">{p.desc}</div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-sm text-[var(--primary)] font-semibold">
                    {formatNum(p.baseCredits + p.bonus)}
                  </span>
                  <span className="text-[11px] text-[var(--primary)]">积分</span>
                  {p.bonus > 0 && (
                    <span className="text-[10px] text-white bg-[var(--primary)] px-1 py-px rounded ml-auto">
                      送 {formatNum(p.bonus)}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* 自定义金额 — 合并在套餐模块内，紧凑 */}
        <div className="mt-3 pt-3 border-t border-dashed border-[var(--primary-lighter)]">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="useCustom"
              checked={useCustom}
              onChange={(e) => setUseCustom(e.target.checked)}
              className="w-3.5 h-3.5 accent-[var(--primary)]"
            />
            <label
              htmlFor="useCustom"
              className="text-xs text-[var(--muted)] cursor-pointer select-none"
            >
              自定义金额（¥1 - ¥99,999，不享赠送）
            </label>
            <div className="flex-1 flex items-center border border-[var(--primary-lighter)] rounded-md px-2.5 py-1.5 bg-white focus-within:border-[var(--primary)] transition-colors ml-auto">
              <span className="text-[var(--muted)] text-xs mr-1">¥</span>
              <input
                type="number"
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  if (e.target.value) setUseCustom(true);
                }}
                placeholder="输入金额"
                min={1}
                max={99999}
                step="0.01"
                className="flex-1 outline-none text-sm text-[var(--foreground)] bg-transparent w-0"
              />
            </div>
            <div className="text-xs text-[var(--muted)] min-w-[120px] text-right">
              {customValid ? (
                <span className="text-[var(--primary)] font-medium">
                  = {formatNum(Math.floor(customNum * RATIO))} 积分
                </span>
              ) : (
                <span>实时换算</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 支付方式 — SVG logo */}
      <div className="wb-card">
        <div className="text-sm font-medium text-[var(--foreground)] mb-2.5">支付方式</div>
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { key: 'wechat', label: '微信支付', Logo: WechatLogo },
            { key: 'alipay', label: '支付宝', Logo: AlipayLogo },
          ].map((m) => (
            <button
              key={m.key}
              onClick={() => setPayMethod(m.key as 'wechat' | 'alipay')}
              className={`p-2.5 rounded-lg border-2 flex items-center gap-2.5 transition-all ${
                payMethod === m.key
                  ? 'border-[var(--primary)] bg-[var(--primary-light)]'
                  : 'border-gray-100 hover:border-[var(--primary-lighter)]'
              }`}
            >
              <m.Logo />
              <span className="text-sm font-medium text-[var(--foreground)]">{m.label}</span>
              {payMethod === m.key && (
                <span className="ml-auto text-[var(--primary)] text-sm">✓</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 订单摘要 + 支付按钮 */}
      <div className="wb-card border-[var(--primary-lighter)]">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-medium text-[var(--foreground)]">订单摘要</div>
        </div>
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-[var(--muted)]">套餐</span>
            <span className="text-[var(--foreground)]">{summary.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--muted)]">应付金额</span>
            <span className="text-[var(--foreground)]">¥{summary.price.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--muted)]">基础积分</span>
            <span className="text-[var(--foreground)]">{formatNum(summary.credits)}</span>
          </div>
          {summary.bonus > 0 && (
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">赠送积分</span>
              <span className="text-[var(--primary)]">+{formatNum(summary.bonus)}</span>
            </div>
          )}
          <div className="pt-2 mt-2 border-t border-[var(--primary-lighter)] flex justify-between items-baseline">
            <span className="text-[var(--muted)]">实得积分</span>
            <span className="text-xl font-bold text-[var(--primary)]">
              {formatNum(summary.total)} <span className="text-xs font-normal text-[var(--muted)]">积分</span>
            </span>
          </div>
        </div>
        <button
          onClick={handlePay}
          disabled={useCustom && !customValid}
          className="mt-4 w-full py-2.5 bg-[var(--primary)] text-white font-medium rounded-md hover:bg-[var(--primary-dark)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          立即支付 ¥{summary.price.toFixed(2)}
        </button>
      </div>

      {/* FAQ */}
      <div className="text-xs text-[var(--muted)] space-y-0.5">
        <div>· 支付完成后积分将在 1 分钟内自动到账</div>
        <div>· 充值金额不支持提现，但购买的积分长期有效</div>
        <div>· 如需开具发票，请联系右下角在线客服</div>
        <div>· 遇到问题可前往 <a href="/faq" className="text-[var(--primary)] hover:underline">常见问题</a> 查看更多</div>
      </div>

      {/* 支付二维码弹窗 */}
      {showQR && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowQR(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-80 max-w-[90vw] text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-base font-medium text-[var(--foreground)] mb-1">
              {payMethod === 'wechat' ? '微信' : '支付宝'}扫码支付
            </div>
            <div className="text-xs text-[var(--muted)] mb-4">
              ¥{summary.price.toFixed(2)} · {formatNum(summary.total)} 积分
            </div>
            <div className="w-48 h-48 mx-auto bg-[var(--primary-light)] border-2 border-[var(--primary-lighter)] rounded-lg flex items-center justify-center text-[var(--muted)] text-xs">
              {payMethod === 'wechat' ? '微信支付二维码' : '支付宝二维码'}
              <br />
              （Demo 占位）
            </div>
            <div className="mt-4 text-xs text-[var(--muted)]">
              请使用{payMethod === 'wechat' ? '微信' : '支付宝'}扫码完成支付
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setShowQR(false)}
                className="flex-1 py-2 border border-gray-200 text-[var(--muted)] rounded-md hover:bg-gray-50 text-sm"
              >
                取消
              </button>
              <button
                onClick={handleConfirmPaid}
                className="flex-1 py-2 bg-[var(--primary)] text-white rounded-md hover:bg-[var(--primary-dark)] text-sm"
              >
                已完成支付
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 支付成功弹窗 */}
      {paid && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4"
          onClick={() => setPaid(null)}
        >
          <div
            className="bg-white rounded-2xl p-8 max-w-sm w-full text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-16 h-16 mx-auto rounded-full bg-[var(--primary-light)] flex items-center justify-center">
              <span className="text-3xl">✓</span>
            </div>
            <h3 className="mt-4 text-lg font-semibold text-[var(--foreground)]">支付成功</h3>
            <p className="mt-1 text-sm text-[var(--muted)]">{paid.name} · ¥{paid.price.toFixed(2)}</p>
            <div className="mt-5 py-4 rounded-lg bg-[var(--primary-light)]">
              <div className="text-xs text-[var(--muted)]">本次到账</div>
              <div className="text-2xl font-semibold text-[var(--primary)] mt-1">
                +{formatNum(paid.total)}
              </div>
              <div className="text-xs text-[var(--muted)] mt-2">当前余额</div>
              <div className="text-base font-medium text-[var(--foreground)]">
                {formatNum(paid.newBalance)}
              </div>
            </div>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setPaid(null)}
                className="flex-1 h-10 rounded-lg border border-gray-200 text-sm text-[var(--foreground)] hover:bg-gray-50"
              >
                继续充值
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="flex-1 h-10 rounded-lg bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white text-sm"
              >
                回到控制台
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
