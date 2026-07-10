"use client";

import type { VanhaasterActivity, VanhaasterException } from "@/lib/demo/vanhaaster";
import { priorityLabel } from "../hooks/useVanhaasterDemo";

export function ExceptionQueue({ items }: { items: VanhaasterException[] }) {
  return (
    <>
      {items.map((item) => (
        <div key={item.id} className="vn-exception">
          <span className={`vn-pill ${item.priority}`}>{priorityLabel(item.priority)}</span>
          <div>
            <p className="vn-exception-title">{item.title}</p>
            <p className="vn-exception-detail">{item.detail}</p>
          </div>
          <span className="vn-exception-time">{item.timestamp}</span>
        </div>
      ))}
    </>
  );
}

export function ActivityFeed({ items, limit }: { items: VanhaasterActivity[]; limit?: number }) {
  const visible = limit ? items.slice(0, limit) : items;

  return (
    <div className={`vn-feed ${limit ? "vn-feed-compact" : "vn-feed-full"}`}>
      {visible.map((item) => (
        <article key={item.id} className="vn-feed-item">
          <span className={`vn-feed-dot ${item.tone}`} aria-hidden />
          <div>
            <p className="vn-feed-agent">{item.agentName}</p>
            <p className="vn-feed-message">{item.message}</p>
            {item.projectId && <p className="vn-feed-meta">{item.projectId}</p>}
          </div>
        </article>
      ))}
    </div>
  );
}

export function MiniSparkline({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);
  return (
    <div className="vn-sparkline" aria-hidden>
      {values.map((value, index) => (
        <span
          key={index}
          className="vn-sparkline-bar"
          style={{ height: `${Math.max(12, (value / max) * 100)}%` }}
        />
      ))}
    </div>
  );
}
