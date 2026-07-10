"use client";

import { VANHAASTER_CONNECTORS } from "@/lib/demo/vanhaaster";

export function ConnectorsView() {
  const connected = VANHAASTER_CONNECTORS.filter((c) => c.status === "connected").length;
  const syncing = VANHAASTER_CONNECTORS.filter((c) => c.status === "syncing").length;
  const planned = VANHAASTER_CONNECTORS.filter((c) => c.status === "planned").length;

  return (
    <div className="vn-view">
      <section className="vn-kpi-hero vn-kpi-hero-3">
        <article className="vn-kpi-card">
          <p className="vn-kpi-label">Connected</p>
          <p className="vn-kpi-value success">{connected}</p>
        </article>
        <article className="vn-kpi-card">
          <p className="vn-kpi-label">Syncing</p>
          <p className="vn-kpi-value accent">{syncing}</p>
        </article>
        <article className="vn-kpi-card">
          <p className="vn-kpi-label">Fase 2</p>
          <p className="vn-kpi-value">{planned}</p>
        </article>
      </section>

      <div className="vn-connectors-grid">
        {VANHAASTER_CONNECTORS.map((connector) => (
          <article key={connector.id} className="vn-connector-card">
            <div className="vn-connector-head">
              <p className="vn-connector-name">{connector.name}</p>
              <span className={`vn-pill ${connectorStatusClass(connector.status)}`}>
                {connectorStatusLabel(connector.status)}
              </span>
            </div>
            <p className="vn-connector-meta">Laatste sync: {connector.lastSync}</p>
            <p className="vn-connector-records">{connector.records}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

function connectorStatusLabel(status: string) {
  if (status === "connected") return "Connected";
  if (status === "syncing") return "Syncing";
  return "Fase 2";
}

function connectorStatusClass(status: string) {
  if (status === "connected") return "success";
  if (status === "syncing") return "review";
  return "info";
}
