'use client';

import { useState } from 'react';

type Platform = 'macos' | 'windows';

interface TabConfig {
  key: Platform;
  label: string;
  /** 视频源 URL（CDN/OSS），未配置时显示占位 */
  videoUrl?: string;
  /** 视频封面图 */
  poster?: string;
  /** 视频时长（秒），仅展示用 */
  duration?: number;
}

const TABS: TabConfig[] = [
  { key: 'macos',   label: 'macOS 一键配置' },
  { key: 'windows', label: 'Windows 一键配置' },
];

function formatDuration(sec?: number) {
  if (!sec) return '0:00';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function VideoTutorial() {
  const [active, setActive] = useState<Platform>('macos');
  const current = TABS.find((t) => t.key === active)!;
  const hasVideo = !!current.videoUrl;

  return (
    <div>
      <div className="flex items-center justify-between mb-2.5">
        <h2 className="text-sm font-medium text-[var(--foreground)]">配置教程</h2>
        <span className="text-[10px] text-[var(--muted)]">视频持续更新中</span>
      </div>

      {/* Tab 栏 — 圆角胶囊 + 选中色 */}
      <div className="inline-flex p-1 bg-gray-100 rounded-lg mb-3">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActive(t.key)}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-all ${
              active === t.key
                ? 'bg-white text-[var(--primary)] shadow-sm'
                : 'text-[var(--muted)] hover:text-[var(--foreground)]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 视频区 — 16:9 比例 */}
      <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-[var(--primary-lighter)] bg-gradient-to-br from-gray-50 to-gray-100">
        {hasVideo ? (
          <video
            key={current.key}
            src={current.videoUrl}
            poster={current.poster}
            controls
            className="w-full h-full object-cover bg-black"
          >
            <track kind="captions" />
          </video>
        ) : (
          // 占位状态 — 等待用户配置视频源
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
            <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-3">
              <svg
                className="w-7 h-7 text-[var(--primary)] ml-0.5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <div className="text-sm font-medium text-[var(--foreground)]">
              {current.label} · 教程视频
            </div>
            <div className="text-xs text-[var(--muted)] mt-1.5 max-w-xs">
              视频待上传。配置位置：<code className="px-1.5 py-0.5 bg-white rounded text-[10px] text-[var(--primary)]">
                src/components/VideoTutorial.tsx
              </code>
            </div>
            <div className="text-[10px] text-[var(--muted)] mt-1">
              在 <code className="text-[var(--primary)]">TABS</code> 数组里配置 videoUrl / poster / duration 即可生效
            </div>
          </div>
        )}

        {/* 视频右下角时长 — 视频存在时显示 */}
        {hasVideo && current.duration && (
          <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/60 text-white text-[10px] rounded">
            {formatDuration(current.duration)}
          </div>
        )}
      </div>

      {/* 文字说明 — 视频下方补充 */}
      <div className="mt-2.5 text-[11px] text-[var(--muted)] leading-relaxed">
        {active === 'macos' && 'macOS 用户推荐使用一键配置脚本，3 步完成 IDE 集成与环境变量注入。'}
        {active === 'windows' && 'Windows 用户推荐使用 PowerShell 一键脚本，自动化配置 WorkBuddy CLI。'}
      </div>
    </div>
  );
}
