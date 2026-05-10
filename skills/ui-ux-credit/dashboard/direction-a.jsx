// Direction A — "Safe / Trust-first"
// Classic dark dashboard: navy cards on near-black, gold used sparingly, restrained typography.

const { useState, useEffect, useRef, useMemo } = React;

// === Score gauge — chunky semicircle, 5 color bands, position dot on arc ===
function ScoreGaugeA({ score, grade, model, delta, animate, lang }) {
  const [shown, setShown] = useState(animate ? 300 : score);
  const [arc, setArc] = useState(animate ? 0 : 1);

  useEffect(() => {
    if (!animate) return;
    const duration = 1500;
    const start = performance.now();
    let raf;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(Math.round(300 + (score - 300) * eased));
      setArc(eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score, animate]);

  const pct = Math.max(0, Math.min(1, (score - 300) / 550));

  // Geometry — semicircle. viewBox 320 x 200. cx=160, cy=170, r=130.
  const cx = 160, cy = 170, r = 130;
  const stroke = 22;
  const angle = Math.PI - Math.PI * pct * arc;
  const dotX = cx + r * Math.cos(angle);
  const dotY = cy - r * Math.sin(angle);

  // Score bands as fractions of 0..1 over the 300-850 range
  // POOR 300-579, FAIR 580-669, GOOD 670-739, VERY GOOD 740-799, EXCELLENT 800-850
  const gap = 0.008; // small visual gap between segments
  const segments = [
    { start: 0,     end: 0.508 - gap, color: "#D24F66" }, // POOR — pink-red
    { start: 0.508, end: 0.671 - gap, color: "#E08A3C" }, // FAIR — warm orange
    { start: 0.671, end: 0.798 - gap, color: "#E8C547" }, // GOOD — yellow-gold
    { start: 0.798, end: 0.907 - gap, color: "#A8C957" }, // VERY GOOD — yellow-green
    { start: 0.907, end: 1,           color: "#5FB97D" }, // EXCELLENT — green
  ];

  const gradeColors = {
    POOR: "#D24F66", FAIR: "#E08A3C", GOOD: "#E8C547",
    VERY_GOOD: "#A8C957", EXCELLENT: "#5FB97D"
  };
  const color = gradeColors[grade] || "#E8C547";

  const arcPath = (start, end) => {
    if (end <= start) return null;
    const a1 = Math.PI - Math.PI * start;
    const a2 = Math.PI - Math.PI * end;
    const x1 = cx + r * Math.cos(a1), y1 = cy - r * Math.sin(a1);
    const x2 = cx + r * Math.cos(a2), y2 = cy - r * Math.sin(a2);
    const large = end - start > 0.5 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  };

  const gradeLabel = (lang === "en"
    ? { POOR: "POOR", FAIR: "FAIR", GOOD: "GOOD", VERY_GOOD: "VERY GOOD", EXCELLENT: "EXCELLENT" }
    : { POOR: "POBRE", FAIR: "REGULAR", GOOD: "BUENO", VERY_GOOD: "MUY BUENO", EXCELLENT: "EXCELENTE" }
  )[grade] || grade;

  const modelLabel = model === "VS 3.0" ? "VANTAGE SCORE 3.0" : model.toUpperCase();

  return (
    <div className="score-gauge-a">
      <svg width="320" height="200" viewBox="0 0 320 200">
        {/* Background dim arc segments */}
        {segments.map((s, i) => {
          const d = arcPath(s.start, s.end);
          return d ? (
            <path key={`bg-${i}`} d={d} fill="none" stroke={s.color}
              strokeWidth={stroke} strokeLinecap="round" opacity="0.16" />
          ) : null;
        })}
        {/* Foreground — filled to score position */}
        {segments.map((s, i) => {
          const fillEnd = Math.min(s.end, pct * arc);
          if (fillEnd <= s.start) return null;
          const d = arcPath(s.start, fillEnd);
          return d ? (
            <path key={`fg-${i}`} d={d} fill="none" stroke={s.color}
              strokeWidth={stroke} strokeLinecap="round" />
          ) : null;
        })}
        {/* Position dot on the arc — outer ring + inner cream dot */}
        <circle cx={dotX} cy={dotY} r="11" fill="#0c1220" stroke={color} strokeWidth="3" />
        <circle cx={dotX} cy={dotY} r="4" fill="#f0e5cc" />

        {/* Center number */}
        <text x={cx} y={cy - 32} textAnchor="middle" fill="#f0e5cc"
          fontSize="62" fontFamily="Plus Jakarta Sans" fontWeight="700" letterSpacing="-2">
          {shown}
        </text>
        {/* Delta to the right of the score — triangle + number left-aligned so gap from score stays constant for 1/2/3 digits.
            When delta === 0 (first-time analysis with no prior baseline) → show "0" in green, no arrow. */}
        {(() => {
          const isFirst = delta === 0;
          const color = isFirst ? "#5fb97d" : (delta < 0 ? "#d97082" : "#5fb97d");
          return (
            <g transform={`translate(${cx + 70}, ${cy - 56})`}>
              {!isFirst && (
                <text fill={color} fontSize="11" fontWeight="700"
                  fontFamily="Plus Jakarta Sans" textAnchor="start" dominantBaseline="middle">
                  {delta > 0 ? "▲" : "▼"}
                </text>
              )}
              <text y={isFirst ? 0 : 15} fill={color} fontSize="12" fontWeight="600"
                fontFamily="Plus Jakarta Sans" textAnchor="start" dominantBaseline="middle"
                style={{ fontVariantNumeric: "tabular-nums" }}>
                {isFirst ? "0" : Math.abs(delta)}
              </text>
            </g>
          );
        })()}
        {/* Model label — replaces "Your Credit Rating" */}
        <text x={cx} y={cy - 10} textAnchor="middle" fill="#98a0b3"
          fontSize="11" fontFamily="Plus Jakarta Sans" letterSpacing="2.5" fontWeight="500">
          {modelLabel}
        </text>
        {/* Grade label — large, in band color */}
        <text x={cx} y={cy + 22} textAnchor="middle" fill={color}
          fontSize="22" fontFamily="Plus Jakarta Sans" fontWeight="700" letterSpacing="3">
          {gradeLabel}
        </text>
      </svg>
    </div>
  );
}

// === Segmented factor donut — one big chart, click to select ===
function FactorScoreDonut({ factors, lang, animate, model }) {
  const isFico = (model || "").toUpperCase().includes("FICO");
  const wKey = isFico ? "weight_fico" : "weight_vs";

  // Short labels that fit inside narrow segments
  const shortNames = {
    "Payment History": { es: "PAGOS", en: "PAYMENT" },
    "Amounts Owed":    { es: "DEUDA", en: "OWED" },
    "Length of Credit": { es: "ANTIGÜEDAD", en: "LENGTH" },
    "New Credit":      { es: "NUEVO", en: "NEW" },
    "Credit Mix":      { es: "MEZCLA", en: "MIX" },
  };

  const [selected, setSelected] = useState(null);
  const [arc, setArc] = useState(animate ? 0 : 1);

  useEffect(() => {
    if (!animate) return;
    const duration = 1300;
    const start = performance.now();
    let raf;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      setArc(1 - Math.pow(1 - t, 3));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [animate, model]);

  // Geometry — filled annular sectors (proper donut slices), not stroked arcs
  const cx = 260, cy = 260;
  const ri = 142;       // inner radius
  const ro = 232;       // outer radius — 90px thick ring
  const gap = 0.022;    // radians between segments
  const cr = 7;         // corner radius (minimal rounding)

  const total = factors.reduce((s, f) => s + f[wKey], 0);
  let cursor = -Math.PI / 2;
  const segments = factors.map((f, i) => {
    const span = (f[wKey] / total) * (Math.PI * 2) * arc;
    const start = cursor + gap / 2;
    const end = Math.max(start + 0.001, cursor + span - gap / 2);
    cursor += (f[wKey] / total) * (Math.PI * 2);
    return { ...f, weight: f[wKey], start, end, mid: (start + end) / 2, idx: i };
  });

  // Build a filled annular sector path with rounded corners
  const sectorPath = (s, e) => {
    if (e <= s) return null;
    const aoOut = Math.min(cr / ro, (e - s) / 3);
    const aoIn  = Math.min(cr / ri, (e - s) / 3);
    const polar = (r, a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];

    const [ax, ay] = polar(ro, s + aoOut);          // outer-start (after corner)
    const [bx, by] = polar(ro, e - aoOut);          // outer-end (before corner)
    const [cx2, cy2] = polar(ro - cr, e);           // pivot inward from outer-end
    const [dx, dy] = polar(ri + cr, e);             // pivot at inner-end
    const [ex, ey] = polar(ri, e - aoIn);           // inner-end (after corner)
    const [fx, fy] = polar(ri, s + aoIn);           // inner-start (before corner)
    const [gx, gy] = polar(ri + cr, s);             // pivot at inner-start
    const [hx, hy] = polar(ro - cr, s);             // pivot inward from outer-start

    const largeOut = (e - s - 2 * aoOut) > Math.PI ? 1 : 0;
    const largeIn  = (e - s - 2 * aoIn)  > Math.PI ? 1 : 0;

    return [
      `M ${hx} ${hy}`,
      `A ${cr} ${cr} 0 0 1 ${ax} ${ay}`,            // start corner
      `A ${ro} ${ro} 0 ${largeOut} 1 ${bx} ${by}`,  // outer arc
      `A ${cr} ${cr} 0 0 1 ${cx2} ${cy2}`,          // end corner (outer)
      `L ${dx} ${dy}`,                              // radial line in
      `A ${cr} ${cr} 0 0 1 ${ex} ${ey}`,            // end corner (inner)
      `A ${ri} ${ri} 0 ${largeIn} 0 ${fx} ${fy}`,   // inner arc reversed
      `A ${cr} ${cr} 0 0 1 ${gx} ${gy}`,            // start corner (inner)
      `L ${hx} ${hy}`,
      'Z',
    ].join(' ');
  };

  // For label placement: midline of the ring
  const r = (ri + ro) / 2;

  const sel = selected !== null ? factors[selected] : null;
  const selColor = sel ? window.getGradeColor(sel.grade) : "#C4A052";

  return (
    <div className="factor-score-donut">
      <div className="fsd-chart-wrap">
        <svg width="520" height="520" viewBox="0 0 520 520"
          onClick={() => setSelected(null)}>
          <rect x="0" y="0" width="520" height="520" fill="transparent" />
          {segments.map((seg, i) => {
            const color = window.getGradeColor(seg.grade);
            const isSel = i === selected;
            const d = sectorPath(seg.start, seg.end);
            if (!d) return null;
            const lx = cx + r * Math.cos(seg.mid);
            const ly = cy + r * Math.sin(seg.mid);
            const shortName = shortNames[seg.factor_en]
              ? shortNames[seg.factor_en][lang === "en" ? "en" : "es"]
              : window.t(seg.factor_es, seg.factor_en, lang).toUpperCase();
            const tooNarrow = seg[wKey] < 4;
            return (
              <g key={i}
                onClick={(e) => { e.stopPropagation(); setSelected(i); }}
                style={{ cursor: "pointer" }}>
                <path d={d}
                  fill={color}
                  opacity={selected === null || isSel ? 1 : 0.32}
                  stroke={isSel ? "#f0e5cc" : "none"}
                  strokeWidth={isSel ? 1.5 : 0}
                  style={{ transition: "opacity 0.25s" }}
                />
                <path d={d} fill="transparent" />
                {/* Grade letter inside the colored segment */}
                <text x={lx} y={tooNarrow ? ly + 9 : ly - 4}
                  textAnchor="middle"
                  fill="#0c1220"
                  fontSize="26" fontWeight="800"
                  fontFamily="Plus Jakarta Sans"
                  style={{ pointerEvents: "none" }}>
                  {seg.grade}
                </text>
                {/* Short factor name beneath the letter, inside the segment */}
                {!tooNarrow && (
                  <text x={lx} y={ly + 17}
                    textAnchor="middle"
                    fill="#0c1220"
                    fontSize="10" fontWeight="700"
                    fontFamily="Plus Jakarta Sans"
                    letterSpacing="0.4"
                    opacity="0.85"
                    style={{ pointerEvents: "none" }}>
                    {shortName}
                  </text>
                )}
              </g>
            );
          })}
          {sel ? (
            <>
              <text x={cx} y={cy - 48} textAnchor="middle" fill="#7a8499"
                fontSize="11" letterSpacing="2.5" fontWeight={500}
                fontFamily="Plus Jakarta Sans">
                {(lang === "en" ? "WEIGHT" : "PESO")}
              </text>
              <text x={cx} y={cy + 22} textAnchor="middle" fill={selColor}
                fontSize="62" fontWeight="700" letterSpacing="-2"
                fontFamily="Plus Jakarta Sans">
                {sel[wKey]}%
              </text>
            </>
          ) : (
            <>
              <text x={cx} y={cy - 6} textAnchor="middle" fill="#98a0b3"
                fontSize="11" letterSpacing="2.5" fontWeight={600}
                fontFamily="Plus Jakarta Sans">
                {lang === "en" ? "5 FACTORS" : "5 FACTORES"}
              </text>
              <text x={cx} y={cy + 18} textAnchor="middle" fill="#5d6680"
                fontSize="11" fontWeight={400}
                fontFamily="Plus Jakarta Sans">
                {lang === "en" ? "Click any to explore" : "Haz click para explorar"}
              </text>
            </>
          )}
        </svg>
      </div>

      {/* Side widget */}
      <div className="fsd-side" style={{ borderColor: sel ? selColor + "55" : "#1a2438" }}>
        {sel ? (
          <div className="fsd-side-head">
            <div className="fsd-side-grade" style={{ color: selColor, borderColor: selColor }}>
              {sel.grade}
            </div>
            <div>
              <div className="fsd-side-name">{window.t(sel.factor_es, sel.factor_en, lang)}</div>
              <div className="fsd-side-meta">
                <span style={{ color: selColor }}>{sel[wKey]}%</span>
                <span className="fsd-side-dot">·</span>
                <span>{lang==="en"?"of your score":"de tu score"}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="fsd-side-intro">
            <h3>{lang==="en"?"What's moving your score":"Qué está moviendo tu score"}</h3>
            <p>{lang==="en"
              ? "Five factors total. Click any segment to see why it's affecting your score."
              : "Cinco factores en total. Haz click en cualquier sección para ver por qué afecta tu score."}</p>
          </div>
        )}
        {sel && <p className="fsd-side-text">{window.t(sel.explanation_es, sel.explanation_en, lang)}</p>}
        <div className="fsd-side-list">
          {factors.map((f, i) => (
            <button key={i} className={`fsd-side-item ${i === selected ? "active" : ""}`}
              onClick={() => setSelected(i)}>
              <span className="fsd-li-dot" style={{ background: window.getGradeColor(f.grade) }} />
              <span className="fsd-li-name">{window.t(f.factor_es, f.factor_en, lang)}</span>
              <span className="fsd-li-grade" style={{ color: window.getGradeColor(f.grade) }}>{f.grade}</span>
              <span className="fsd-li-weight">{f[wKey]}%</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// === Bureau dots ===
function BureauDotsA({ statuses }) {
  const map = {
    "Pays as Agreed": "#5fa87a",
    "Closed": "#7a8499",
    "ChargeOff": "#d97082",
    "Collection": "#d97082",
    "30 Days Late": "#C4A052",
    "Deferred": "#7a8499",
    "Removed": "#3d4763",
  };
  return (
    <div className="bureau-dots-a">
      {["eq", "ex", "tu"].map((b, i) => (
        <div key={b} className="bdot-wrap" title={`${["Equifax", "Experian", "TransUnion"][i]}: ${statuses[b]}`}>
          <div className="bdot" style={{ background: map[statuses[b]] || "#3d4763" }} />
          <span className="blabel">{["EQ", "EX", "TU"][i]}</span>
        </div>
      ))}
    </div>
  );
}

// === Account chip (left list, master) ===
function AccountChipA({ acct, lang, active, onClick }) {
  const colors = window.getStatusColor(acct.group);
  return (
    <button className={`acct-chip-a ${active ? "active" : ""}`} onClick={onClick}
      style={{ borderColor: active ? colors.border : "#1a2438", background: active ? colors.bg : "transparent" }}>
      <span className="acc-creditor-a">{acct.creditor}</span>
      <span className="acc-status-a" style={{ color: colors.text }}>
        {window.t(acct.friendly_status_es, acct.friendly_status_en, lang)}
      </span>
    </button>
  );
}

// === Legacy account card (kept for compatibility, no longer rendered) ===
function AccountCardA({ acct, lang }) {
  const [open, setOpen] = useState(false);
  const colors = window.getStatusColor(acct.group);
  const fmt = (v) => v == null ? "—" : `$${v.toLocaleString()}`;

  return (
    <div className="account-card-a" style={{ borderLeftColor: colors.border }}>
      <button className="acct-header" onClick={() => setOpen(o => !o)}>
        <div className="acct-main">
          <div className="acct-name">{acct.creditor}</div>
          <div className="acct-type">{window.t(acct.type_es, acct.type_en, lang)}</div>
        </div>
        <div className="acct-status" style={{ color: colors.text }}>
          {window.t(acct.friendly_status_es, acct.friendly_status_en, lang)}
        </div>
        <BureauDotsA statuses={acct.status_per_bureau} />
        <span className={`chev ${open ? "open" : ""}`}>›</span>
      </button>
      {open && (
        <div className="acct-detail">
          <div className="acct-grid">
            <div><span className="lbl">{lang==="en"?"Opened":"Abierta"}</span><span>{acct.opened}</span></div>
            <div><span className="lbl">{lang==="en"?"Last activity":"Última actividad"}</span><span>{acct.last_activity}</span></div>
            <div><span className="lbl">{lang==="en"?"Monthly":"Mensual"}</span><span>{fmt(acct.monthly)}</span></div>
            <div><span className="lbl">{lang==="en"?"Limit":"Límite"}</span><span>{fmt(acct.limit)}</span></div>
            {acct.original_creditor && (
              <div><span className="lbl">{lang==="en"?"Original creditor":"Acreedor original"}</span><span>{acct.original_creditor}</span></div>
            )}
            {acct.utilization != null && (
              <div><span className="lbl">{lang==="en"?"Utilization":"Uso"}</span><span style={{color: acct.utilization > 30 ? "#C4A052" : "#5fa87a"}}>{acct.utilization}%</span></div>
            )}
          </div>
          <div className="acct-bureaus">
            <div className="acct-bhead">{lang==="en"?"Per bureau":"Por buró"}</div>
            {[["eq","Equifax"],["ex","Experian"],["tu","TransUnion"]].map(([k, name]) => (
              <div key={k} className="acct-brow">
                <span className="bname">{name}</span>
                <span className="bbal">{fmt(acct.balance[k])}</span>
                <span className="bstat">{acct.status_per_bureau[k]}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// === Anomaly card ===
function AnomalyCardA({ a, lang }) {
  const sevColor = { HIGH: "#B03642", MEDIUM: "#C4A052", LOW: "#5fa87a" }[a.severity];
  const sevLabel = { HIGH: lang==="en"?"Critical":"Crítico",
                     MEDIUM: lang==="en"?"Medium":"Mediano",
                     LOW: lang==="en"?"Minor":"Menor" }[a.severity];
  return (
    <div className="anomaly-a" style={{ borderLeftColor: sevColor }}>
      <div className="an-head">
        <span className="an-sev" style={{ color: sevColor, borderColor: sevColor }}>{sevLabel}</span>
        <span className="an-cite">{a.citation}</span>
      </div>
      <h4 className="an-title">{window.t(a.title_es, a.title_en, lang)}</h4>
      <p className="an-explain">{window.t(a.explanation_es, a.explanation_en, lang)}</p>
      <div className="an-affected">
        {a.affected.map(x => <span key={x} className="an-chip">{x}</span>)}
      </div>
      <div className="an-action">
        <span className="an-action-lbl">{lang==="en"?"What we'll do":"Lo que vamos a hacer"}</span>
        <span className="an-action-text">{window.t(a.action_es, a.action_en, lang)}</span>
      </div>
    </div>
  );
}

// === Timeline step ===
function TimelineStepA({ step, lang }) {
  return (
    <div className="tl-step-a">
      <div className="tl-dot" />
      <div className="tl-body">
        <div className="tl-action">{window.t(step.action_es, step.action_en, lang)}</div>
        <div className="tl-reason">{window.t(step.reason_es, step.reason_en, lang)}</div>
        <div className="tl-effort">{typeof step.effort === "object" ? window.t(step.effort.es, step.effort.en, lang) : step.effort}</div>
      </div>
    </div>
  );
}

// === MAIN ===
function DirectionA({ lang, animate }) {
  const D = window.AUDIT_DATA;
  const [filter, setFilter] = useState("all");
  const [selectedAcct, setSelectedAcct] = useState(0);

  const filteredAnomalies = useMemo(() => {
    if (filter === "all") return D.anomalies;
    return D.anomalies.filter(a => a.severity === filter);
  }, [filter]);

  const grouped = useMemo(() => ({
    attention: D.accounts.filter(a => a.group === "attention"),
    collections: D.accounts.filter(a => a.group === "collections"),
    good: D.accounts.filter(a => a.group === "good"),
  }), []);

  const greeting = lang === "en"
    ? `${D.user.first_name}, here is your credit, explained.`
    : `${D.user.first_name}, este es tu crédito, explicado.`;

  return (
    <div className="dir-a">
      {/* Hero */}
      <header className="hero-a">
        <div className="hero-a-top">
          <div className="hero-a-flow">
            {lang==="en"?"FLOW":"FLUJO"} {D.routing.flow}
            <span className="hero-a-flow-dot">·</span>
            {window.t(D.routing.phase_name_es, D.routing.phase_name_en, lang).toUpperCase()}
          </div>
          <span className="audit-date">{D.user.audit_date}</span>
        </div>
        <div className="hero-a-grid">
          <div className="hero-a-left">
            <h1 className="greeting">{greeting}</h1>
            <p className="summary">
              {lang === "en"
                ? <>Your scores sit in the <em>FAIR / POOR</em> band today — driven mostly by reporting errors on accounts that should be in good standing. We've identified <strong>{D.action_plan.total_disputable_items}</strong> disputable items. Worked methodically, the expected impact is <strong>+80 to +150 points in 12–18 weeks</strong>.</>
                : <>Tus scores están hoy en el rango <em>FAIR / POOR</em> — principalmente por errores de reporte en cuentas que deberían estar al día. Hemos identificado <strong>{D.action_plan.total_disputable_items}</strong> problemas disputables. Trabajándolos metódicamente, el impacto esperado es <strong>+80 a +150 puntos en 12-18 semanas</strong>.</>}
            </p>
          </div>
          <div className="hero-a-right">
            <div className="hero-a-impact">
              <div className="hai-label">{lang==="en"?"EXPECTED IMPACT":"IMPACTO ESPERADO"}</div>
              <div className="hai-value">+80<span className="hai-arrow">→</span>+150</div>
              <div className="hai-unit">{lang==="en"?"points · 12–18 weeks":"puntos · 12-18 semanas"}</div>
            </div>
          </div>
        </div>

        <div className="scores-row">
          {[["equifax","Equifax","logos/equifax.svg"],["experian","Experian","logos/experian.svg"],["transunion","TransUnion","logos/transunion.svg"]].map(([k, name, src]) => {
            const s = D.scores[k];
            return (
              <div key={k} className="score-card-a">
                <div className="sc-bureau">
                  <img src={src} alt={name} className={`bureau-logo bureau-logo-${k}`} />
                </div>
                <ScoreGaugeA score={s.score} grade={s.grade} model={s.model} delta={s.delta} animate={animate} lang={lang} />
              </div>
            );
          })}
        </div>
      </header>

      {/* Factors */}
      <section className="section-a">
        <FactorScoreDonut factors={D.factor_grades} lang={lang} animate={animate}
          model={D.scores.equifax.model} />
      </section>

      {/* Accounts — master/detail */}
      <section className="section-a">
        <div className="sec-head">
          <h2>{lang==="en"?"Your accounts, one by one":"Tus cuentas, una por una"}</h2>
          <p>{lang==="en"?"Tap any account to read what we found.":"Toca cualquier cuenta para leer qué encontramos."}</p>
        </div>
        {(() => {
          const acct = D.accounts[selectedAcct];
          const acctColors = window.getStatusColor(acct.group);
          return (
            <div className="shelf-a">
              <div className="shelf-list-a">
                {D.accounts.map((a, i) => (
                  <AccountChipA key={a.creditor} acct={a} lang={lang}
                    active={i === selectedAcct} onClick={() => setSelectedAcct(i)} />
                ))}
              </div>
              <div className="shelf-detail-a" style={{ borderColor: acctColors.border }}>
                <div className="sd-head-a">
                  <div>
                    <div className="sd-creditor-a">{acct.creditor}</div>
                    <div className="sd-type-a">{window.t(acct.type_es, acct.type_en, lang)}</div>
                  </div>
                  <div className="sd-status-a" style={{ color: acctColors.text, borderColor: acctColors.border }}>
                    {window.t(acct.friendly_status_es, acct.friendly_status_en, lang)}
                  </div>
                </div>
                <div className="sd-grid-a">
                  <div><dt>{lang==="en"?"Opened":"Abierta"}</dt><dd>{acct.opened}</dd></div>
                  <div><dt>{lang==="en"?"Last activity":"Última actividad"}</dt><dd>{acct.last_activity}</dd></div>
                  <div><dt>{lang==="en"?"Limit":"Límite"}</dt><dd>{acct.limit ? `$${acct.limit.toLocaleString()}` : "—"}</dd></div>
                  <div><dt>{lang==="en"?"Monthly":"Mensual"}</dt><dd>{acct.monthly ? `$${acct.monthly}` : "—"}</dd></div>
                  {acct.utilization != null && <div><dt>{lang==="en"?"Utilization":"Uso"}</dt><dd style={{color: acct.utilization > 30 ? "#C4A052":"#5fa87a"}}>{acct.utilization}%</dd></div>}
                  {acct.original_creditor && <div><dt>{lang==="en"?"Original":"Original"}</dt><dd>{acct.original_creditor}</dd></div>}
                </div>
                <div className="sd-bureaus-a">
                  {[["eq","Equifax"],["ex","Experian"],["tu","TransUnion"]].map(([k, name]) => (
                    <div key={k} className="sd-bureau-a">
                      <span className="sdb-name-a">{name}</span>
                      <span className="sdb-bal-a">{acct.balance[k] != null ? `$${acct.balance[k].toLocaleString()}` : "—"}</span>
                      <span className="sdb-stat-a">{window.getStatusLabel(acct.status_per_bureau[k], lang)}</span>
                    </div>
                  ))}
                </div>
                {acct.flags.length > 0 && (
                  <div className="sd-flags-a">
                    {acct.flags.map(f => <span key={f} className="sd-flag-a">{window.getFlagLabel(f, lang)}</span>)}
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </section>

      {/* Anomalies */}
      <section className="section-a">
        <div className="sec-head">
          <h2>{lang==="en"?"Issues explained":"Tus problemas explicados"}</h2>
          <div className="filter-chips">
            {[
              ["all", lang==="en"?"All":"Todos", D.anomalies.length],
              ["HIGH", lang==="en"?"Critical":"Críticos", D.anomalies.filter(a=>a.severity==="HIGH").length],
              ["MEDIUM", lang==="en"?"Medium":"Medianos", D.anomalies.filter(a=>a.severity==="MEDIUM").length],
              ["LOW", lang==="en"?"Minor":"Menores", D.anomalies.filter(a=>a.severity==="LOW").length],
            ].map(([k, lbl, n]) => (
              <button key={k} className={`chip ${filter===k?"active":""}`} onClick={() => setFilter(k)}>
                {lbl} <span className="chip-n">{n}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="anomaly-grid">
          {filteredAnomalies.map(a => <AnomalyCardA key={a.id} a={a} lang={lang} />)}
        </div>
      </section>

      {/* Action plan */}
      <section className="section-a">
        <div className="sec-head sec-head-split">
          <div>
            <h2>{lang==="en"?"Your action plan":"Tu plan de acción"}</h2>
            <p>{D.action_plan.total_disputable_items} {lang==="en"?"disputable items identified":"problemas disputables identificados"}</p>
          </div>
          <div className="impact-pill">
            <span className="ip-label">{lang==="en"?"Expected impact":"Impacto esperado"}</span>
            <span className="ip-value">{window.t(D.action_plan.expected_impact_es, D.action_plan.expected_impact_en, lang)}</span>
          </div>
        </div>
        <div className="timeline-a">
          {[
            ["this_week", lang==="en"?"This week":"Esta semana"],
            ["weeks_2_3", lang==="en"?"Weeks 2–3":"Semanas 2-3"],
            ["weeks_4_8", lang==="en"?"Weeks 4–8":"Semanas 4-8"],
            ["weeks_8_18", lang==="en"?"Weeks 8–18":"Semanas 8-18"],
          ].map(([key, label]) => (
            <div key={key} className="tl-phase">
              <div className="tl-phase-head">{label}</div>
              {D.action_plan[key].map((s, i) => <TimelineStepA key={i} step={s} lang={lang} />)}
            </div>
          ))}
        </div>
      </section>

      {/* Context */}
      <section className="section-a context-section">
        <div className="sec-head">
          <h2>{lang==="en"?"Your context":"Tu contexto"}</h2>
          <p>{lang==="en"?"What you've shared so far. The more we know, the more personalized the plan.":"Lo que has compartido. Mientras más sepamos, más personalizado el plan."}</p>
        </div>
        <div className="context-grid">
          {Object.entries(D.account_context).map(([creditor, ctx]) => (
            <div key={creditor} className="ctx-card">
              <div className="ctx-creditor">{creditor}</div>
              <div className="ctx-rows">
                <div><span className="ctx-lbl">{lang==="en"?"Letters":"Cartas"}</span><span>{window.t(ctx.letters_received_es, ctx.letters_received_en, lang)}</span></div>
                <div><span className="ctx-lbl">{lang==="en"?"Calls":"Llamadas"}</span><span>{window.t(ctx.calls_es, ctx.calls_en, lang)}</span></div>
                <div><span className="ctx-lbl">{lang==="en"?"Hardship":"Dificultad"}</span><span>{window.t(ctx.hardship_es, ctx.hardship_en, lang)}</span></div>
                <div><span className="ctx-lbl">{lang==="en"?"Documents":"Documentos"}</span><span>{window.t(ctx.docs_es, ctx.docs_en, lang)}</span></div>
              </div>
            </div>
          ))}
          <button className="ctx-add">
            + {lang==="en"?"Add more context":"Agregar más contexto"}
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer-a">
        <div className="footer-actions">
          <button className="btn-gold">{lang==="en"?"Resume my journey":"Reanudar mi journey"}</button>
          <button className="btn-ghost">{lang==="en"?"Download PDF":"Descargar PDF"}</button>
          <button className="btn-ghost">{lang==="en"?"Print":"Imprimir"}</button>
        </div>
        <div className="footer-disclaimer">
          {lang==="en"
            ? "This analysis is educational, not legal advice. For formal legal action, consult NACA (consumeradvocates.org) or a consumer-law attorney."
            : "Este análisis es educativo, no asesoría legal. Para acción legal formal, consulta NACA (consumeradvocates.org) o un abogado de ley del consumidor."}
        </div>
      </footer>
    </div>
  );
}

window.DirectionA = DirectionA;
