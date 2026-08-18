'use client';

import { use, useState, useMemo } from 'react';
import type { ModelLine } from '@/lib/data';
import { models, videoTutorials } from '@/lib/data';
import { useBalance } from '@/lib/useBalance';
import ModelTable from '@/components/ModelTable';
import VideoList from '@/components/VideoList';

export default function ModelLinePage({ params }: { params: Promise<{ line: string }> }) {
  const { line: rawLine } = use(params);
  const line = (rawLine === 'codebuddy' ? 'codebuddy' : 'workbuddy') as ModelLine;
  const [tab, setTab] = useState<'config' | 'manual' | 'tutorial'>('config');
  const balance = useBalance();
  const lineName = line === 'workbuddy' ? 'WorkBuddy' : 'CodeBuddy';
  const list = useMemo(() => models.filter((m) => m.line === line), [line]);
  const tutorials = line === 'workbuddy' ? videoTutorials.slice(0, 2) : videoTutorials.slice(2, 4);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="wb-h1">{lineName} 配置</h1>
        <p className="wb-sub">
          {line === 'workbuddy'
            ? '通用对话 / Agent / 长文档场景，使用兼容 OpenAI 的 Base URL 接入。'
            : 'IDE 内代码补全、行内建议与重构，兼容主流编辑器插件。'}
        </p>
      </div>

      <div className="flex items-center gap-1 border-b border-gray-100">
        <button
          onClick={() => setTab('config')}
          className={`px-4 py-2 text-sm border-b-2 -mb-px transition-colors ${tab === 'config' ? 'border-[var(--primary)] text-[var(--primary)] font-medium' : 'border-transparent text-[var(--muted)] hover:text-[var(--foreground)]'}`}
        >
          {lineName} 配置
        </button>
        <button
          onClick={() => setTab('tutorial')}
          className={`px-4 py-2 text-sm border-b-2 -mb-px transition-colors ${tab === 'tutorial' ? 'border-[var(--primary)] text-[var(--primary)] font-medium' : 'border-transparent text-[var(--muted)] hover:text-[var(--foreground)]'}`}
        >
          视频教程
        </button>
        <button
          onClick={() => setTab('manual')}
          className={`px-4 py-2 text-sm border-b-2 -mb-px transition-colors ${tab === 'manual' ? 'border-[var(--primary)] text-[var(--primary)] font-medium' : 'border-transparent text-[var(--muted)] hover:text-[var(--foreground)]'}`}
        >
          手动配置
        </button>
      </div>

      {tab === 'config' ? (
        <>
          <div className="wb-card">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="text-sm font-medium text-[var(--foreground)]">API Key</div>
                <div className="text-xs text-[var(--muted)] mt-1">请妥善保管，不要在客户端代码或公开仓库中提交。</div>
                <div className="mt-3 font-mono text-sm bg-[var(--primary-light)] border border-[var(--primary-lighter)] rounded px-3 py-2 inline-block">
                  sk-prod-7a8b9c0d1e2f3g4h5i6j****
                </div>
              </div>
              <div className="flex gap-2">
                <button className="wb-btn">复制</button>
                <button className="wb-btn">重置</button>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-[var(--muted)] space-y-1">
              <div>Base URL：<span className="font-mono text-[var(--foreground)]">https://api.wb-model.com/v1</span></div>
              <div>当前余额：<span className="text-[var(--primary)] font-medium">{balance.toLocaleString()}</span> 积分</div>
            </div>
          </div>

          <ModelTable list={list} />

          <div className="text-xs text-[var(--muted)]">
            执行 macOS / Windows 一键配置命令会自动写入全部模型；✓ 表示支持，— 表示不支持。定价单位为积分/百万 tokens（输入与输出同价）。
          </div>
        </>
      ) : tab === 'manual' ? (
        <ManualConfig line={line} lineName={lineName} />
      ) : (
        <VideoList tutorials={tutorials} />
      )}
    </div>
  );
}

function ManualConfig({ line, lineName }: { line: ModelLine; lineName: string }) {
  const steps = line === 'workbuddy'
    ? [
        { title: '1. 获取 API Key', desc: '在「WorkBuddy 配置」页复制你的 sk-prod-*** 密钥。' },
        { title: '2. 选择接入方式', desc: '兼容 OpenAI Chat Completions / Anthropic Messages 协议，可直接接入 Cursor、ChatBox、Cherry Studio、NextChat 等客户端。' },
        { title: '3. 填入 Base URL 与 Key', desc: 'Base URL: https://api.wb-model.com/v1    API Key: 粘贴上一步复制的密钥' },
        { title: '4. 选择模型并发送', desc: '在下拉里挑选你需要的模型（例如 gpt-4o、claude-sonnet-4），发送第一条消息即可开始计费。' },
      ]
    : [
        { title: '1. 安装 IDE 插件', desc: '在 VS Code / JetBrains 插件市场搜索 "CodeBuddy"，或在 Cursor 设置 → Models → OpenAI Compatible 中填入以下信息。' },
        { title: '2. 配置 OpenAI 兼容端点', desc: 'Base URL: https://api.wb-model.com/v1    API Key: 粘贴你的 sk-prod-*** 密钥' },
        { title: '3. 开启 Inline Suggestion', desc: '在 VS Code 设置里搜索 "inline suggest"，确认 Editor: Inline Suggest Enabled 为勾选状态。' },
        { title: '4. 选择代码补全模型', desc: '推荐使用 deepseek-coder / codestral-latest，首次按 Tab 接受补全时开始计费。' },
      ];
  return (
    <div className="space-y-4">
      <div className="wb-card">
        <div className="text-sm font-medium text-[var(--foreground)] mb-1">{lineName} 手动配置指南</div>
        <div className="text-xs text-[var(--muted)]">按以下 4 步完成 {lineName} 的接入，无需执行一键配置命令。</div>
      </div>
      <ol className="wb-faq-list">
        {steps.map((s, i) => (
          <li key={i} className="wb-faq-item">
            <div className="wb-faq-q" style={{ cursor: 'default' }}>
              <span className="wb-faq-num">{i + 1}</span>
              <span className="wb-faq-q-text">{s.title}</span>
            </div>
            <div className="wb-faq-a">{s.desc}</div>
          </li>
        ))}
      </ol>
      <div className="text-xs text-[var(--muted)]">
        完成后可在 IDE 或客户端里直接发起调用；遇到 401/403 错误时请回到「{lineName} 配置」页检查 API Key 是否已重置。
      </div>
    </div>
  );
}
