"use client";

import { ChevronRight } from "lucide-react";

interface Crumb {
  label: string;
  onClick?: () => void;
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav className="vn-breadcrumbs" aria-label="Breadcrumb">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={`${item.label}-${index}`} className="vn-breadcrumb-item">
            {index > 0 && <ChevronRight className="vn-breadcrumb-sep" aria-hidden />}
            {item.onClick && !isLast ? (
              <button type="button" className="vn-breadcrumb-link" onClick={item.onClick}>
                {item.label}
              </button>
            ) : (
              <span className={isLast ? "vn-breadcrumb-current" : "vn-breadcrumb-muted"}>
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}

export function ProgressBar({
  value,
  label,
  showLabel = true,
  size = "md",
}: {
  value: number;
  label?: string;
  showLabel?: boolean;
  size?: "sm" | "md";
}) {
  return (
    <div className={`vn-progress-block ${size === "sm" ? "is-sm" : ""}`}>
      {(label || showLabel) && (
        <div className="vn-progress-label">
          {label && <span>{label}</span>}
          {showLabel && <span>{value}%</span>}
        </div>
      )}
      <div className="vn-progress-bar" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
        <div className="vn-progress-fill" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
