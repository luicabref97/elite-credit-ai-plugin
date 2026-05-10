// PDF Print Artboard — light, monochrome, gold rules.

const { useState: useStateP } = React;

function PDFArtboard({ lang }) {
  const D = window.AUDIT_DATA;
  const fmt = (v) => v == null ? "—" : `$${v.toLocaleString()}`;

  return (
    <div className="pdf-page">
      <header className="pdf-head">
        <div className="pdf-brand">ELITE CREDIT AI</div>
        <div className="pdf-meta">
          <div>{lang==="en"?"Credit Audit Report":"Reporte de Auditoría de Crédito"}</div>
          <div className="pdf-meta-sub">{D.user.first_name} {D.user.last_name} · ····{D.user.ssn_last4} · {D.user.audit_date}</div>
        </div>
      </header>
      <div className="pdf-rule"></div>

      <section className="pdf-section">
        <h2>{lang==="en"?"Scores":"Puntajes"}</h2>
        <div className="pdf-scores">
          {[["equifax","Equifax"],["experian","Experian"],["transunion","TransUnion"]].map(([k, n]) => (
            <div key={k} className="pdf-score">
              <div className="pdf-score-bureau">{n}</div>
              <div className="pdf-score-num">{D.scores[k].score}</div>
              <div className="pdf-score-grade">{D.scores[k].grade} · {D.scores[k].model}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="pdf-section">
        <h2>{lang==="en"?"Score factors":"Factores del puntaje"}</h2>
        <table className="pdf-table">
          <thead>
            <tr>
              <th>{lang==="en"?"Factor":"Factor"}</th>
              <th>{lang==="en"?"Weight":"Peso"}</th>
              <th>{lang==="en"?"Grade":"Calificación"}</th>
              <th>{lang==="en"?"Notes":"Notas"}</th>
            </tr>
          </thead>
          <tbody>
            {D.factor_grades.map(f => (
              <tr key={f.factor_en}>
                <td>{window.t(f.factor_es, f.factor_en, lang)}</td>
                <td>{f.weight}%</td>
                <td className="pdf-grade">{f.grade}</td>
                <td>{window.t(f.explanation_es, f.explanation_en, lang)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="pdf-section">
        <h2>{lang==="en"?"Accounts":"Cuentas"}</h2>
        <table className="pdf-table">
          <thead>
            <tr>
              <th>{lang==="en"?"Creditor":"Acreedor"}</th>
              <th>{lang==="en"?"Type":"Tipo"}</th>
              <th>EQ</th>
              <th>EX</th>
              <th>TU</th>
              <th>{lang==="en"?"Status":"Estado"}</th>
            </tr>
          </thead>
          <tbody>
            {D.accounts.map(a => (
              <tr key={a.creditor}>
                <td>{a.creditor}</td>
                <td>{window.t(a.type_es, a.type_en, lang)}</td>
                <td>{fmt(a.balance.eq)}</td>
                <td>{fmt(a.balance.ex)}</td>
                <td>{fmt(a.balance.tu)}</td>
                <td>{window.t(a.friendly_status_es, a.friendly_status_en, lang)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="pdf-section">
        <h2>{lang==="en"?"Issues found":"Problemas encontrados"}</h2>
        {D.anomalies.map((a, i) => (
          <div key={a.id} className="pdf-anomaly">
            <div className="pdf-an-head">
              <span className="pdf-an-num">{String(i+1).padStart(2,"0")}</span>
              <span className={`pdf-an-sev sev-${a.severity}`}>{a.severity}</span>
              <span className="pdf-an-cite">{a.citation}</span>
            </div>
            <h4>{window.t(a.title_es, a.title_en, lang)}</h4>
            <p>{window.t(a.explanation_es, a.explanation_en, lang)}</p>
            <p className="pdf-an-action"><strong>{lang==="en"?"Action":"Acción"}:</strong> {window.t(a.action_es, a.action_en, lang)}</p>
          </div>
        ))}
      </section>

      <section className="pdf-section">
        <h2>{lang==="en"?"Action plan":"Plan de acción"}</h2>
        <div className="pdf-plan-impact">
          {lang==="en"?"Expected impact":"Impacto esperado"}: <strong>{window.t(D.action_plan.expected_impact_es, D.action_plan.expected_impact_en, lang)}</strong>
        </div>
        {[
          ["this_week", lang==="en"?"This week":"Esta semana"],
          ["weeks_2_3", lang==="en"?"Weeks 2–3":"Semanas 2-3"],
          ["weeks_4_8", lang==="en"?"Weeks 4–8":"Semanas 4-8"],
          ["weeks_8_18", lang==="en"?"Weeks 8–18":"Semanas 8-18"],
        ].map(([k, lbl]) => (
          <div key={k} className="pdf-plan-block">
            <h4>{lbl}</h4>
            <ul>
              {D.action_plan[k].map((s, j) => (
                <li key={j}>
                  <strong>{window.t(s.action_es, s.action_en, lang)}</strong>
                  <span className="pdf-plan-reason">{window.t(s.reason_es, s.reason_en, lang)}</span>
                  <span className="pdf-plan-effort">{typeof s.effort === "object" ? (lang === "en" ? s.effort.en : s.effort.es) : s.effort}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <footer className="pdf-foot">
        <div className="pdf-rule"></div>
        <p>{lang==="en"
          ? "This analysis is educational, not legal advice. For formal legal action, consult NACA (consumeradvocates.org) or a consumer-law attorney."
          : "Este análisis es educativo, no asesoría legal. Para acción legal formal, consulta NACA (consumeradvocates.org) o un abogado de ley del consumidor."}</p>
        <p className="pdf-foot-meta">Elite Credit AI · {D.user.audit_date} · {lang==="en"?"Page":"Página"} 1 / 1</p>
      </footer>
    </div>
  );
}

window.PDFArtboard = PDFArtboard;
