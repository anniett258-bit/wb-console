'use client';

import { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { faqItems } from '@/lib/data';

// useSearchParams() 在 Next.js 16 静态预渲染时会报错, 强制走动态渲染
export const dynamic = 'force-dynamic';

const categories = ['全部', '计费', '模型', '充值', '使用', '技术', '安全'];

function FAQContent() {
  const sp = useSearchParams();
  const initialCat = sp.get('cat') || '全部';
  const [cat, setCat] = useState(initialCat);
  const [q, setQ] = useState('');

  const list = useMemo(() => {
    return faqItems
      .filter((f) => {
        const matchCat = cat === '全部' || f.category === cat;
        const matchQ = !q || f.question.toLowerCase().includes(q.toLowerCase()) || f.answer.toLowerCase().includes(q.toLowerCase());
        return matchCat && matchQ;
      })
      .map((f, i) => ({ ...f, _displayNum: i + 1 }));
  }, [cat, q]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="wb-h1">常见问题</h1>
        <p className="wb-sub">点击问题查看详细解答，找不到答案可联系在线客服。</p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
              cat === c
                ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                : 'bg-white text-[var(--muted)] border-gray-200 hover:border-[var(--primary)] hover:text-[var(--primary)]'
            }`}
          >
            {c}
          </button>
        ))}
        <div className="ml-auto w-64">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜索问题..."
            className="wb-input"
          />
        </div>
      </div>

      <div className="wb-faq-list">
        {list.length === 0 ? (
          <div className="text-center text-[var(--muted)] text-sm py-12">没有匹配的问题</div>
        ) : (
          list.map((f) => (
            <details key={f.id} className="wb-faq-item">
              <summary className="wb-faq-q">
                <span className="wb-faq-num">{f._displayNum}</span>
                <span className="wb-faq-q-text">{f.question}</span>
                <span className="wb-faq-arrow">▾</span>
              </summary>
              <div className="wb-faq-a">{f.answer}</div>
            </details>
          ))
        )}
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3 pt-2">
        <div>
          <div className="text-sm font-medium text-[var(--foreground)]">没找到答案？</div>
          <div className="text-xs text-[var(--muted)] mt-0.5">工作日 9:00-18:00 实时响应，留言后我们会在 1 小时内联系你。</div>
        </div>
        <button
          type="button"
          className="wb-btn wb-btn-primary"
          onClick={() => {
            if (typeof window !== 'undefined' && (window as any).__openService) {
              (window as any).__openService();
            }
          }}
        >
          联系在线客服
        </button>
      </div>
    </div>
  );
}

export default function FAQPage() {
  return (
    <Suspense fallback={<div className="text-[var(--muted)] text-sm">加载中…</div>}>
      <FAQContent />
    </Suspense>
  );
}
