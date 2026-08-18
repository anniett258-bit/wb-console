'use client';

import type { VideoTutorial } from '@/lib/data';

export default function VideoList({ tutorials }: { tutorials: VideoTutorial[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {tutorials.map((v) => (
        <a key={v.id} href={v.url} className="wb-card !p-0 overflow-hidden hover:border-[var(--primary)] transition-colors group block">
          <div className="aspect-video bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center relative">
            <div className="text-5xl opacity-50 group-hover:scale-110 transition-transform">{v.cover}</div>
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="var(--primary)">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
            <div className="absolute bottom-2 right-2 text-[11px] bg-black/60 text-white px-1.5 py-0.5 rounded">{v.duration}</div>
          </div>
          <div className="p-3">
            <div className="text-sm font-medium text-[var(--foreground)] group-hover:text-[var(--primary)]">{v.title}</div>
          </div>
        </a>
      ))}
    </div>
  );
}
