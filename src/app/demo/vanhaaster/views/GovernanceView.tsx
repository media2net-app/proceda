"use client";

import { GOVERNANCE_LEVELS } from "@/lib/demo/vanhaaster";

export function GovernanceView() {
  return (
    <div className="vn-view">
      <section className="vn-panel">
        <div className="vn-panel-title">
          <h2>Approval-first</h2>
        </div>
        <p className="vn-panel-desc">
          AI bereidt voor, vat samen, controleert en zet interne taken uit. Externe communicatie,
          creatieve richting, offertes en publicatie blijven achter een quality gate — jullie akkoord.
        </p>
      </section>

      <section className="vn-panel">
        <div className="vn-panel-title">
          <h2>Automatiseringniveaus A0–A4</h2>
        </div>
        <div className="vn-levels">
          {GOVERNANCE_LEVELS.map((level) => (
            <article
              key={level.level}
              className={`vn-level-card ${level.active ? "is-active" : ""}`}
            >
              <div className="vn-level-badge">{level.level}</div>
              <div>
                <p className="vn-level-title">{level.label}</p>
                <p className="vn-level-desc">{level.desc}</p>
              </div>
              <span className={`vn-pill ${level.active ? "review" : "info"}`}>
                {level.active ? "Actief" : "Fase 2"}
              </span>
            </article>
          ))}
        </div>
      </section>

      <div className="vn-grid vn-grid-2">
        <section className="vn-panel">
          <div className="vn-panel-title">
            <h2>Project &amp; bronnen</h2>
          </div>
          <ul className="vn-list">
            <li>Elk project één project-ID (bijv. VNH-2026-047)</li>
            <li>Bronhiërarchie: briefing → huisstijlgids → laatste goedgekeurde versie</li>
            <li>Bij conflict wint de hoogste bron — geen giswerk</li>
          </ul>
        </section>
        <section className="vn-panel">
          <div className="vn-panel-title">
            <h2>Audit &amp; stopregels</h2>
          </div>
          <ul className="vn-list">
            <li>Audit log op elke actie — wie keurde wat goed en wanneer</li>
            <li>Stopregels bij twijfel: geen actie, escalatie naar directie</li>
            <li>Rechtenmatrix: stagiair ziet niet wat alleen directie mag zien</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
