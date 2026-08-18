'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'wechat' | 'code'>('wechat');
  const [redeemCode, setRedeemCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleWechatLogin = () => {
    setLoading(true);
    setErrorMsg('');
    // Demo: simulate WeChat login
    setTimeout(() => {
      setLoading(false);
      router.push('/dashboard');
    }, 1500);
  };

  const handleRedeemLogin = () => {
    if (!redeemCode.trim()) {
      setErrorMsg('请输入兑换码');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    // Demo: simulate redeem code login
    setTimeout(() => {
      setLoading(false);
      router.push('/dashboard');
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-amber-50 px-4">
      <div className="w-full max-w-md wb-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 shadow-lg"
            style={{ background: 'linear-gradient(135deg, #ffa153, #ffc28a)' }}
          >
            WB
          </div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">阿彤木很酷</h1>
          <p className="text-sm text-[var(--muted)] mt-2">积分服务控制台</p>
        </div>

        {/* Card */}
        <div className="wb-card" style={{ padding: '32px' }}>
          {/* Tabs */}
          <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => { setMode('wechat'); setErrorMsg(''); }}
              className={`flex-1 py-2 text-sm rounded-md transition-all ${
                mode === 'wechat' ? 'bg-white text-[var(--foreground)] shadow-sm font-medium' : 'text-[var(--muted)]'
              }`}
            >
              微信登录
            </button>
            <button
              onClick={() => { setMode('code'); setErrorMsg(''); }}
              className={`flex-1 py-2 text-sm rounded-md transition-all ${
                mode === 'code' ? 'bg-white text-[var(--foreground)] shadow-sm font-medium' : 'text-[var(--muted)]'
              }`}
            >
              兑换码登录
            </button>
          </div>

          {mode === 'wechat' ? (
            <div className="text-center">
              <div className="w-48 h-48 mx-auto bg-gray-50 rounded-xl flex flex-col items-center justify-center border border-gray-100 mb-6">
                <div className="text-6xl mb-3 opacity-60">
                  {loading ? '⏳' : '📱'}
                </div>
                <p className="text-xs text-[var(--muted)]">
                  {loading ? '正在授权中...' : '微信扫码登录'}
                </p>
              </div>
              <button
                onClick={handleWechatLogin}
                disabled={loading}
                className="wb-btn wb-btn-primary wb-btn-lg w-full"
                style={{ background: loading ? '#ccc' : undefined }}
              >
                {loading ? '授权中...' : '微信一键登录'}
              </button>
              <p className="text-xs text-[var(--muted)] mt-3">
                点击即表示同意《用户服务协议》和《隐私政策》
              </p>
            </div>
          ) : (
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  兑换码
                </label>
                <input
                  type="text"
                  value={redeemCode}
                  onChange={(e) => setRedeemCode(e.target.value)}
                  placeholder="请输入兑换码，如 WBAI-XXXX-XXXX"
                  className="wb-input"
                  onKeyDown={(e) => e.key === 'Enter' && handleRedeemLogin()}
                />
              </div>
              {errorMsg && (
                <div className="text-sm mb-3" style={{ color: 'var(--danger)' }}>{errorMsg}</div>
              )}
              <button
                onClick={handleRedeemLogin}
                disabled={loading}
                className="wb-btn wb-btn-primary wb-btn-lg w-full"
                style={{ background: loading ? '#ccc' : undefined }}
              >
                {loading ? '验证中...' : '登录 / 激活'}
              </button>
              <p className="text-xs text-[var(--muted)] mt-3 text-center">
                新用户使用兑换码将自动注册并激活账户
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-[var(--muted)]">
            遇到问题？查看 <a href="/faq" className="underline" style={{ color: 'var(--primary)' }}>常见问题</a> 或联系客服
          </p>
        </div>
      </div>

      {/* 公众号关注卡片（浮动右下） */}
      <div className="hidden lg:block fixed bottom-6 right-6 w-44 bg-white rounded-xl border border-[var(--primary-lighter)] shadow-lg p-4 z-10">
        <div className="text-xs text-[var(--muted)] mb-2 text-center">关注公众号</div>
        <div className="aspect-square bg-white rounded-lg overflow-hidden border border-gray-100">
          <img src="/images/wx-public-qr.jpg" alt="公众号二维码" className="w-full h-full object-contain" />
        </div>
        <div className="text-center mt-2 text-sm font-medium text-[var(--foreground)]">阿彤木很酷</div>
        <div className="text-center text-[10px] text-[var(--muted)] mt-0.5">活动码 / 兑换码首发</div>
      </div>
    </div>
  );
}
