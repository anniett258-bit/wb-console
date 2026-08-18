'use client';

import type { Model } from '@/lib/data';

export default function ModelTable({ list }: { list: Model[] }) {
  return (
    <div className="wb-card !p-0 overflow-hidden">
      <table className="wb-table">
        <thead>
          <tr>
            <th>模型</th>
            <th style={{ minWidth: 220 }}>适合场景</th>
            <th>最大输入</th>
            <th>最大输出</th>
            <th>工具调用</th>
            <th>视觉</th>
            <th>推理</th>
            <th>价格</th>
          </tr>
        </thead>
        <tbody>
          {list.map((m) => (
            <tr key={m.id}>
              <td className="font-mono font-medium text-[var(--foreground)]">{m.name}</td>
              <td className="text-[var(--muted)] text-[13px]">{m.scene}</td>
              <td className="text-[var(--muted)]">{m.maxInput}</td>
              <td className="text-[var(--muted)]">{m.maxOutput}</td>
              <td>{m.toolUse ? <span className="wb-tag wb-tag-yes">✓</span> : <span className="wb-tag wb-tag-no">—</span>}</td>
              <td>{m.vision ? <span className="wb-tag wb-tag-yes">✓</span> : <span className="wb-tag wb-tag-no">—</span>}</td>
              <td>{m.reasoning ? <span className="wb-tag wb-tag-yes">✓</span> : <span className="wb-tag wb-tag-no">—</span>}</td>
              <td className="text-[var(--primary)] font-medium whitespace-nowrap">{m.price}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
