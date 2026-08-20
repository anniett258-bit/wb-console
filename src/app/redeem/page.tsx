'use client';

import { Suspense, useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { redeemRecords as mockRedeemRecords } from '@/lib/data';
import {
  CODE_TABLE,
  getBalance,
  addBalance,
  isCodeUsed,
  markCodeUsed,
  pushRedeemRecord,
  getRedeemLog,
  type RedeemRecordEntry,
} from '@/lib/redeem';

// 兑换码规则：WBAI-XXXX-XXXX-XXXX（4-4-4-4）
const CODE_FORMAT = 'WBAI-XXXX-XXXX-XXXX';
const CODE_REGEX = /^WBAI-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

function formatCode(raw: string): string {
  const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 14);
  const withPrefix = clean.startsWith('WBAI') ? clean : 'WBAI' + clean;
  return withPrefix.match(/.{1,4}/g)!.join('-');
}

function RedeemContent() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ amount: number; balance: number; code: string; tag: string } | null>(null);

  // 当前余额（来自 localStorage，跨页同步）
  const [balance, setBalance] = useState(8711);
  // 实时记录（包含历史 mock + 新激活的）
  const [records, setRecords] = useState<RedeemRecordEntry[]>([]);

  useEffect(() => {
    setBalance(getBalance());
    setRecords(getRedeemLog());
    // 跨页余额变化监听
    const onBalance = (e: Event) => {
      const detail = (e as CustomEvent<number>).detail;
      setBalance(detail);
    };
    window.addEventListener('wb:balance:change', onBalance as EventListener);
    return () => window.removeEventListener('wb:balance:change', onBalance as EventListener);
  }, []);

  // 实时校验状态
  const validation = useMemo(() => {
    if (!code) return { state: 'empty' as const, msg: '' };
    if (code.length < 14) return { state: 'typing' as const, msg: '继续输入…' };
    if (code.length > 14) return { state: 'invalid' as const, msg: '兑换码格式错误' };
    if (!CODE_REGEX.test(code)) return { state: 'invalid' as const, msg: '兑换码格式错误，应为 WBAI-XXXX-XXXX-XXXX' };
    if (!(code in CODE_TABLE)) return { state: 'unknown' as const, msg: '该兑换码无效' };
    if (isCodeUsed(code)) return { state: 'used' as const, msg: '该兑换码已使用过，不可重复激活' };
    return { state: 'valid' as const, msg: '' };
  }, [code]);

  // 输入框自动聚焦
  useEffect(() => {
    const el = document.getElementById('redeem-input');
    if (el) (el as HTMLInputElement).focus();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCode(formatCode(e.target.value));
    setError(null);
  };

  const handleSubmit = async () => {
    if (validation.state !== 'valid' || submitting) return;
    setSubmitting(true);
    setError(null);
    // 模拟 API 调用
    await new Promise((r) => setTimeout(r, 800));
    const info = CODE_TABLE[code];
    if (!info) {
      setError('该兑换码无效');
      setSubmitting(false);
      return;
    }
    if (isCodeUsed(code)) {
      setError('该兑换码已使用过');
      setSubmitting(false);
      return;
    }
    // 真实到账：写流水 + 加余额 + 标记已用
    const newBalance = addBalance(info.amount);
    markCodeUsed(code);
    const entry = pushRedeemRecord(code, info);
    setBalance(newBalance);
    setRecords([entry, ...records]);
    setSuccess({ amount: info.amount, balance: newBalance, code, tag: info.tag });
    setSubmitting(false);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text');
    setCode(formatCode(text));
  };

  // 兑换记录合并：实时记录优先，mock 作为「历史记录」补充
  const mergedRecords = useMemo(() => {
    const seen = new Set(records.map((r) => r.code));
    const mock = mockRedeemRecords
      .filter((r) => !seen.has(r.code))
      .map((r, i) => ({
        id: `m${i}`,
        code: r.code,
        amount: r.amount,
        createdAt: r.createdAt,
        operator: r.operator,
        tag: '历史',
      }));
    return [...records, ...mock].slice(0, 6);
  }, [records]);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="wb-h1">兑换码激活</h1>
        <p className="wb-sub">输入你在公众号文章或活动里收到的 16 位兑换码，激活后积分实时到账。</p>
      </div>

      {/* 当前余额卡 */}
      <div
        className="rounded-xl px-6 py-5 flex items-center justify-between relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #ffb878 0%, #ffa153 50%, #e5832b 100%)' }}
      >
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10" />
        <div className="absolute -right-4 -bottom-12 w-24 h-24 rounded-full bg-white/10" />
        <div className="relative z-10">
          <div className="text-white/85 text-sm">当前积分余额</div>
          <div className="text-white text-3xl font-semibold mt-1 tracking-wide">
            {balance.toLocaleString('en-US')}
          </div>
        </div>
        <button
          onClick={() => router.push('/recharge')}
          className="relative z-10 px-4 h-9 rounded-lg bg-white/20 hover:bg-white/30 text-white text-sm backdrop-blur transition-colors"
        >
          去充值
        </button>
      </div>

      {/* 兑换码输入区 */}
      <div className="bg-white border border-[var(--primary-lighter)] rounded-xl p-6">
        <label className="block text-sm font-medium text-[var(--foreground)] mb-2">兑换码</label>
        <div className="relative">
          <input
            id="redeem-input"
            type="text"
            value={code}
            onChange={handleChange}
            onPaste={handlePaste}
            placeholder="WBAI-XXXX-XXXX-XXXX"
            maxLength={19}
            className={`w-full h-14 px-4 text-xl font-mono tracking-widest uppercase rounded-lg border-2 outline-none transition-colors ${
              validation.state === 'valid'
                ? 'border-[var(--primary)] bg-[var(--primary-light)] text-[var(--foreground)]'
                : validation.state === 'invalid' || validation.state === 'unknown' || validation.state === 'used'
                ? 'border-red-300 bg-red-50 text-red-700'
                : 'border-[var(--primary-lighter)] bg-white text-[var(--foreground)] focus:border-[var(--primary)]'
            }`}
          />
          {validation.state === 'valid' && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--primary)] text-xl">✓</span>
          )}
        </div>
        <div className="mt-2 h-5 text-xs">
          {validation.msg && (
            <span className={
              validation.state === 'invalid' || validation.state === 'unknown' || validation.state === 'used'
                ? 'text-red-500'
                : 'text-[var(--muted)]'
            }>
              {validation.msg}
            </span>
          )}
          {validation.state === 'valid' && (
            <span className="text-[var(--primary)] font-medium">
              ✓ 有效兑换码（{CODE_TABLE[code].tag}），激活可获得 {CODE_TABLE[code].amount.toLocaleString('en-US')} 积分
            </span>
          )}
        </div>

        {error && (
          <div className="mt-3 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={validation.state !== 'valid' || submitting}
          className="mt-5 w-full h-12 rounded-lg bg-[var(--primary)] hover:bg-[var(--primary-dark)] disabled:bg-gray-200 disabled:cursor-not-allowed text-white font-medium transition-colors flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              激活中…
            </>
          ) : (
            '立即激活'
          )}
        </button>

        <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-[var(--muted)] space-y-1">
          <div>· 兑换码不区分大小写，粘贴时自动转大写</div>
          <div>· 每个兑换码仅可使用一次，激活后立即失效</div>
          <div>· 兑换码来源：公众号「WB模型自购」活动文章 / 客服发放 / 节日福利</div>
        </div>
      </div>

      {/* 兑换说明 + 公众号引导 */}
      <div className="bg-white border border-gray-100 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">如何获取兑换码？</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-[var(--primary-light)] text-[var(--primary)] text-sm font-semibold flex items-center justify-center shrink-0">1</div>
            <div>
              <div className="text-sm font-medium text-[var(--foreground)]">关注公众号</div>
              <div className="text-xs text-[var(--muted)] mt-0.5">关注「WB模型自购」公众号</div>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-[var(--primary-light)] text-[var(--primary)] text-sm font-semibold flex items-center justify-center shrink-0">2</div>
            <div>
              <div className="text-sm font-medium text-[var(--foreground)]">回复关键词</div>
              <div className="text-xs text-[var(--muted)] mt-0.5">活动文章下回复指定关键词</div>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-[var(--primary-light)] text-[var(--primary)] text-sm font-semibold flex items-center justify-center shrink-0">3</div>
            <div>
              <div className="text-sm font-medium text-[var(--foreground)]">获取兑换码</div>
              <div className="text-xs text-[var(--muted)] mt-0.5">公众号自动回复 16 位兑换码</div>
            </div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
          <div className="text-xs text-[var(--muted)]">关注公众号，接收最新活动与兑换码</div>
          <button
            onClick={() => window.open('/images/wx-public-qr.jpg', '_blank')}
            className="text-sm text-[var(--primary)] hover:underline font-medium"
          >
            查看公众号二维码 →
          </button>
        </div>
      </div>

      {/* 最近兑换记录（实时 + 历史） */}
      <div className="bg-white border border-gray-100 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">最近兑换记录</h3>
        {mergedRecords.length === 0 ? (
          <div className="text-sm text-[var(--muted)] py-6 text-center">暂无兑换记录</div>
        ) : (
          <div className="space-y-2">
            {mergedRecords.map((r) => (
              <div key={r.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <div className="font-mono text-sm text-[var(--foreground)] flex items-center gap-2">
                    {r.code}
                    {r.tag !== '历史' && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--primary-light)] text-[var(--primary)] font-sans">
                        {r.tag}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[var(--muted)] mt-0.5">{r.createdAt} · {r.operator}</div>
                </div>
                <div className="text-sm font-medium text-[var(--primary)]">+{r.amount.toLocaleString('en-US')}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 成功弹窗 */}
      {success && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-[var(--primary-light)] flex items-center justify-center">
              <span className="text-3xl">🎉</span>
            </div>
            <h3 className="mt-4 text-lg font-semibold text-[var(--foreground)]">激活成功</h3>
            <p className="mt-1 text-sm text-[var(--muted)]">{success.tag}</p>
            <div className="mt-5 py-4 rounded-lg bg-[var(--primary-light)]">
              <div className="text-xs text-[var(--muted)]">本次到账</div>
              <div className="text-2xl font-semibold text-[var(--primary)] mt-1">
                +{success.amount.toLocaleString('en-US')}
              </div>
              <div className="text-xs text-[var(--muted)] mt-2">当前余额</div>
              <div className="text-base font-medium text-[var(--foreground)]">
                {success.balance.toLocaleString('en-US')}
              </div>
            </div>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => { setSuccess(null); setCode(''); }}
                className="flex-1 h-10 rounded-lg border border-gray-200 text-sm text-[var(--foreground)] hover:bg-gray-50"
              >
                再兑换一个
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

export default function RedeemPage() {
  return (
    <Suspense fallback={null}>
      <RedeemContent />
    </Suspense>
  );
}
