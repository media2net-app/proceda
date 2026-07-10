"use client";

import { INITIAL_EXCEPTIONS } from "@/lib/demo/vanhaaster";
import type { VanhaasterActivity } from "@/lib/demo/vanhaaster";
import { ActivityFeed, ExceptionQueue } from "../components/DemoWidgets";

export function ActivityView({ activities }: { activities: VanhaasterActivity[] }) {
  return (
    <div className="vn-view">
      <div className="vn-grid vn-grid-2">
        <section className="vn-panel">
          <div className="vn-panel-title">
            <h2>Audit trail</h2>
            <span className="vn-badge vn-badge-live">{activities.length} events</span>
          </div>
          <ActivityFeed items={activities} />
        </section>

        <section className="vn-panel">
          <div className="vn-panel-title">
            <h2>Beslissingen &amp; escalaties</h2>
          </div>
          <ExceptionQueue items={INITIAL_EXCEPTIONS} />

          <div className="vn-governance-note">
            <p>
              <strong>Approval-first.</strong> Elke externe actie, escalatie en publicatie
              blijft gelogd. Stopregels bij twijfel — geen actie, maar melding naar directie.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
