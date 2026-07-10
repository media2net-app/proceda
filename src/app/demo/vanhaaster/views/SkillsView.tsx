"use client";

import { VANHAASTER_SKILLS, getAgentName } from "@/lib/demo/vanhaaster";

export function SkillsView() {
  const live = VANHAASTER_SKILLS.filter((s) => s.status === "live");
  const phase2 = VANHAASTER_SKILLS.filter((s) => s.status === "phase2");
  const totalRuns = live.reduce((sum, s) => sum + s.runs, 0);
  const avgSuccess = Math.round(
    live.reduce((sum, s) => sum + s.successRate, 0) / live.length
  );

  const categories = [...new Set(live.map((s) => s.category))];

  return (
    <div className="vn-view">
      <section className="vn-kpi-hero vn-kpi-hero-3">
        <article className="vn-kpi-card">
          <p className="vn-kpi-label">Skills live</p>
          <p className="vn-kpi-value">{live.length}</p>
          <p className="vn-kpi-sub">{phase2.length} in Fase 2</p>
        </article>
        <article className="vn-kpi-card">
          <p className="vn-kpi-label">Totaal runs (30d)</p>
          <p className="vn-kpi-value">{totalRuns.toLocaleString()}</p>
          <p className="vn-kpi-sub">alle Fase 1 skills</p>
        </article>
        <article className="vn-kpi-card">
          <p className="vn-kpi-label">Gem. success rate</p>
          <p className="vn-kpi-value success">{avgSuccess}%</p>
          <p className="vn-kpi-sub">quality gate passed</p>
        </article>
      </section>

      {categories.map((category) => (
        <section key={category} className="vn-panel">
          <div className="vn-panel-title">
            <h2>{category}</h2>
            <span className="vn-badge vn-badge-live">
              {live.filter((s) => s.category === category).length} skills
            </span>
          </div>
          <div className="vn-table-wrap">
            <table className="vn-table">
              <thead>
                <tr>
                  <th>Skill</th>
                  <th>Agent</th>
                  <th>Runs</th>
                  <th>Success</th>
                  <th>Gem. duur</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {live
                  .filter((s) => s.category === category)
                  .map((skill) => (
                    <tr key={skill.id}>
                      <td>
                        <strong>{skill.name}</strong>
                        <span className="vn-table-mono">{skill.id}</span>
                      </td>
                      <td>{getAgentName(skill.agentId)}</td>
                      <td className="vn-num">{skill.runs}</td>
                      <td>
                        <div className="vn-inline-bar">
                          <div
                            className="vn-inline-bar-fill"
                            style={{ width: `${skill.successRate}%` }}
                          />
                          <span>{skill.successRate}%</span>
                        </div>
                      </td>
                      <td className="vn-num">{skill.avgDuration}</td>
                      <td>
                        <span className="vn-pill review">Live</span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      <section className="vn-panel vn-panel-muted">
        <div className="vn-panel-title">
          <h2>Fase 2 skills</h2>
        </div>
        <div className="vn-skills-grid">
          {phase2.map((skill) => (
            <article key={skill.id} className="vn-skill-card">
              <p className="vn-skill-name">{skill.name}</p>
              <p className="vn-skill-agent">{getAgentName(skill.agentId)}</p>
              <span className="vn-pill info">Fase 2</span>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
