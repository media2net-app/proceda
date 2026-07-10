"use client";

import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Bot,
  FolderKanban,
  LayoutDashboard,
  Link2,
  Shield,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import {
  NAV_ITEMS,
  VANHAASTER_BRAND,
  type VanhaasterPage,
} from "@/lib/demo/vanhaaster";

const ICONS: Record<VanhaasterPage, LucideIcon> = {
  dashboard: LayoutDashboard,
  agents: Bot,
  skills: Sparkles,
  projects: FolderKanban,
  team: Users,
  activity: Activity,
  connectors: Link2,
  governance: Shield,
};

interface SidebarProps {
  active: VanhaasterPage;
  onNavigate: (page: VanhaasterPage) => void;
}

export function Sidebar({ active, onNavigate }: SidebarProps) {
  let lastGroup = "";

  return (
    <aside className="vn-sidebar">
      <div className="vn-sidebar-brand">
        <div className="vn-sidebar-logo">P</div>
        <div>
          <p className="vn-sidebar-title">{VANHAASTER_BRAND.partner}</p>
          <p className="vn-sidebar-client">× {VANHAASTER_BRAND.client}</p>
        </div>
      </div>

      <nav className="vn-sidebar-nav" aria-label="Demo navigatie">
        {NAV_ITEMS.map((item) => {
          const showGroup = item.group !== lastGroup;
          lastGroup = item.group ?? lastGroup;
          const Icon = ICONS[item.id];

          return (
            <div key={item.id}>
              {showGroup && item.group && (
                <p className="vn-nav-group">{item.group}</p>
              )}
              <button
                type="button"
                className={`vn-nav-item ${active === item.id ? "is-active" : ""}`}
                onClick={() => onNavigate(item.id)}
              >
                <Icon className="vn-nav-icon" aria-hidden />
                <span>{item.label}</span>
                {item.id === "agents" && (
                  <span className="vn-nav-badge">3 live</span>
                )}
              </button>
            </div>
          );
        })}
      </nav>

      <div className="vn-sidebar-foot">
        <div className="vn-sidebar-status">
          <Zap className="vn-nav-icon" aria-hidden />
          <div>
            <p className="vn-sidebar-status-label">Systeemstatus</p>
            <p className="vn-sidebar-status-value">Fase 1 operationeel</p>
          </div>
        </div>
        <p className="vn-sidebar-note">{VANHAASTER_BRAND.demoLabel}</p>
      </div>
    </aside>
  );
}
