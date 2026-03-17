import { useState, useEffect, useRef, useMemo, useCallback } from "react";

const MOBILE_CSS = `
  @media (max-width: 768px) {
    .responsive-grid { grid-template-columns: 1fr !important; }
    .stat-grid-2 { grid-template-columns: 1fr 1fr !important; }
    .main-padding { padding: 16px 16px 0 !important; }
    .content-padding { padding: 0 16px !important; }
    .bottom-padding { padding: 0 16px 30px !important; }
    .card-padding { padding: 18px !important; }
    .nav-groups { flex-direction: column !important; gap: 12px !important; }
    .nav-group-buttons { flex-wrap: wrap !important; }
    .profile-buttons { flex-wrap: wrap !important; }
  }
  @media (max-width: 480px) {
    .stat-grid-2 { grid-template-columns: 1fr !important; }
  }
`;

const fmt = (n, d = 0) => new Intl.NumberFormat("nb-NO", { minimumFractionDigits: d, maximumFractionDigits: d }).format(n);
const fmtKr = (n) => `${fmt(n)} kr`;
const fmtPct = (n, d = 1) => `${fmt(n, d)} %`;

const OPPJUST = 1.72, SKATT_ALM = 0.22, EFF_SKATT = SKATT_ALM * OPPJUST;
const FORMUE_S1 = 0.01, FORMUE_S2 = 0.011, FORMUE_BUNN = 1700000, VERDI_RABATT = 0.20, SKJERMINGSRENTE = 0.036;

const T = { bg: "#121418", surface: "#1a1c22", surfaceAlt: "rgba(255,255,255,0.03)", border: "rgba(255,255,255,0.07)", borderLight: "rgba(255,255,255,0.12)", text: "#f0f0f3", textSec: "rgba(255,255,255,0.58)", textTer: "rgba(255,255,255,0.34)", accent: "#4da3ff", accentGlow: "rgba(77,163,255,0.1)", green: "#34d399", greenGlow: "rgba(52,211,153,0.1)", orange: "#fbbf24", orangeGlow: "rgba(251,191,36,0.1)", red: "#f87171", redGlow: "rgba(248,113,113,0.1)", purple: "#a78bfa", teal: "#67e8f9", yellow: "#fde68a", pink: "#f472b6" };

// ── Shared UI ──
function Slider({ label, value, onChange, min, max, step = 1, suffix = "", prefix = "", format, decimals }) {
  const [editing, setEditing] = useState(false);
  const [ev, setEv] = useState("");
  const ref = useRef(null);
  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  const dec = decimals ?? (step < 1 ? Math.max(1, String(step).split(".")[1]?.length || 1) : 0);
  const startEdit = () => { setEv(String(value)); setEditing(true); setTimeout(() => ref.current?.select(), 10); };
  const commit = () => { setEditing(false); const p = parseFloat(ev.replace(/\s/g, "").replace(",", ".")); if (!isNaN(p)) onChange(Math.max(min, Math.min(max, Math.round(p / step) * step))); };
  const onKey = (e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); };
  const dv = format ? format(value) : `${prefix}${fmt(value, dec)}${suffix}`;
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
        <label style={{ fontSize: 13, color: T.textSec }}>{label}</label>
        {editing ? (
          <input ref={ref} type="text" value={ev} onChange={e => setEv(e.target.value)} onBlur={commit} onKeyDown={onKey}
            style={{ width: 130, textAlign: "right", background: "rgba(255,255,255,0.08)", border: `1px solid ${T.accent}`, borderRadius: 6, color: T.text, fontSize: 13, fontWeight: 600, padding: "3px 8px", outline: "none", fontFamily: "'SF Mono','Fira Code',monospace", fontVariantNumeric: "tabular-nums" }} />
        ) : (
          <span onClick={startEdit} title="Klikk for å redigere" style={{ fontSize: 13, color: T.text, fontWeight: 600, fontVariantNumeric: "tabular-nums", cursor: "text", padding: "2px 6px", borderRadius: 5, border: "1px solid transparent", transition: "all 0.15s" }}
            onMouseEnter={e => e.target.style.borderColor = T.borderLight} onMouseLeave={e => e.target.style.borderColor = "transparent"}>{dv}</span>
        )}
      </div>
      <div style={{ position: "relative", height: 5, background: "rgba(255,255,255,0.07)", borderRadius: 3 }}>
        <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${T.accent}, ${T.teal})`, borderRadius: 3, transition: "width 0.12s ease" }} />
        <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} style={{ position: "absolute", top: -10, left: 0, width: "100%", height: 24, opacity: 0, cursor: "pointer", margin: 0 }} />
        <div style={{ position: "absolute", top: -4, left: `calc(${pct}% - 6.5px)`, width: 13, height: 13, borderRadius: "50%", background: T.text, boxShadow: "0 1px 6px rgba(0,0,0,0.4)", transition: "left 0.12s ease", pointerEvents: "none" }} />
      </div>
    </div>
  );
}

function Toggle({ label, value, onChange }) { return (<label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 13, color: T.textSec }}><div onClick={() => onChange(!value)} style={{ width: 42, height: 24, borderRadius: 12, position: "relative", cursor: "pointer", background: value ? T.accent : "rgba(255,255,255,0.12)", transition: "background 0.2s" }}><div style={{ width: 20, height: 20, borderRadius: 10, background: "#fff", position: "absolute", top: 2, left: value ? 20 : 2, transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.3)" }} /></div>{label}</label>); }
function Card({ children, style, glow, className }) { return (<div className={className} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, padding: 28, position: "relative", overflow: "hidden", ...style }}>{glow && <div style={{ position: "absolute", top: -80, right: -80, width: 200, height: 200, background: glow, borderRadius: "50%", filter: "blur(80px)", opacity: 0.35, pointerEvents: "none" }} />}<div style={{ position: "relative", zIndex: 1 }}>{children}</div></div>); }
function StatBox({ label, value, color, sub }) { return (<div style={{ background: T.surfaceAlt, borderRadius: 14, padding: "14px 16px", border: `1px solid ${T.border}` }}><div style={{ fontSize: 11, color: T.textTer, marginBottom: 5, letterSpacing: "0.04em", textTransform: "uppercase" }}>{label}</div><div style={{ fontSize: 20, fontWeight: 700, color: color || T.text, fontVariantNumeric: "tabular-nums", lineHeight: 1.2 }}>{value}</div>{sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>{sub}</div>}</div>); }
function SL({ children }) { return <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: T.text }}>{children}</h3>; }
function CB({ label, children, style }) { return (<div style={{ background: T.surfaceAlt, borderRadius: 12, padding: 14, border: `1px solid ${T.border}`, ...style }}>{label && <div style={{ fontSize: 10.5, color: T.textTer, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</div>}{children}</div>); }
const thS = { padding: "8px 10px", textAlign: "right", color: T.textTer, fontWeight: 500, fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.04em" };
function Td({ children, bold, sec, color }) { return (<td style={{ padding: "7px 10px", textAlign: "right", fontVariantNumeric: "tabular-nums", color: color || (sec ? T.textSec : T.text), fontWeight: bold ? 600 : 400, fontSize: 12.5 }}>{children}</td>); }

// ── Interactive Chart with axes, hover, fullscreen ──
function IChart({ data, width: baseW = 360, height: baseH = 120, color = T.accent, yFormat, xFormat, bands, bandColors, title }) {
  const [hover, setHover] = useState(null);
  const [fs, setFs] = useState(false);
  const svgRef = useRef(null);
  if (!data || data.length < 2) return null;

  const w = fs ? 700 : baseW;
  const h = fs ? 380 : baseH;

  const allVals = bands ? [...data, ...bands.flatMap(b => b)] : data;
  const mx = Math.max(...allVals), mn = Math.min(...allVals);
  const rng = mx - mn || 1;
  const padL = fs ? 80 : 65, padR = 15, padT = 12, padB = 26;
  const cw = w - padL - padR, ch = h - padT - padB;
  const toX = (i) => padL + (i / (data.length - 1)) * cw;
  const toY = (v) => padT + ch - ((v - mn) / rng) * ch;
  const pts = (arr) => arr.map((v, i) => `${toX(i)},${toY(v)}`).join(" ");
  const gid = `ic${Math.random().toString(36).slice(2, 8)}`;

  const yTicks = fs ? 8 : 5;
  const yStep = rng / yTicks;
  const yVals = Array.from({ length: yTicks + 1 }, (_, i) => mn + i * yStep);
  const xTicks = fs ? 10 : 6;
  const xStep = Math.max(1, Math.floor(data.length / xTicks));
  const xIdxs = [];
  for (let i = 0; i < data.length; i += xStep) xIdxs.push(i);
  if (xIdxs[xIdxs.length - 1] !== data.length - 1) xIdxs.push(data.length - 1);

  const onMove = (e) => { const rect = svgRef.current?.getBoundingClientRect(); if (!rect) return; const relX = ((e.clientX - rect.left) / rect.width) * w; const idx = Math.round(((relX - padL) / cw) * (data.length - 1)); if (idx >= 0 && idx < data.length) setHover(idx); else setHover(null); };

  const svgContent = (
    <svg ref={svgRef} width="100%" viewBox={`0 0 ${w} ${h}`} style={{ display: "block", cursor: "crosshair" }} onMouseMove={onMove}>
      <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.2" /><stop offset="100%" stopColor={color} stopOpacity="0" /></linearGradient></defs>
      {yVals.map((v, i) => (<g key={i}><line x1={padL} y1={toY(v)} x2={w - padR} y2={toY(v)} stroke="rgba(255,255,255,0.04)" strokeWidth="1" /><text x={padL - 8} y={toY(v) + 3} textAnchor="end" fill={T.textTer} fontSize={fs ? "11" : "9"} fontFamily="system-ui">{yFormat ? yFormat(v) : fmt(v, 0)}</text></g>))}
      {xIdxs.map(i => (<text key={i} x={toX(i)} y={h - 4} textAnchor="middle" fill={T.textTer} fontSize={fs ? "11" : "9"} fontFamily="system-ui">{xFormat ? xFormat(i) : i}</text>))}
      {bands && bands.map((b, bi) => {
        const bandPts = b.map((v, i) => `${toX(i)},${toY(v)}`);
        const mainPtsRev = [...data].map((v, i) => `${toX(data.length - 1 - i)},${toY(data[data.length - 1 - i])}`);
        return (<g key={bi}>
          <polygon points={`${bandPts.join(" ")} ${mainPtsRev.join(" ")}`} fill={bandColors?.[bi] || "rgba(255,255,255,0.05)"} />
          <polyline points={bandPts.join(" ")} fill="none" stroke={bi === 0 ? T.green : T.red} strokeWidth="1.5" strokeDasharray="5,4" opacity="0.6" />
        </g>);
      })}
      <polygon points={`${toX(0)},${toY(mn)} ${pts(data)} ${toX(data.length - 1)},${toY(mn)}`} fill={`url(#${gid})`} />
      <polyline points={pts(data)} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {hover !== null && (<>
        <line x1={toX(hover)} y1={padT} x2={toX(hover)} y2={h - padB} stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeDasharray="3,3" />
        <circle cx={toX(hover)} cy={toY(data[hover])} r="5" fill={color} stroke={T.text} strokeWidth="2" />
      </>)}
    </svg>
  );

  const tooltip = hover !== null && (
    <div style={{ position: "absolute", top: 4, left: `${Math.min(Math.max((toX(hover) / w) * 100, 15), 80)}%`, transform: "translateX(-50%)", background: "rgba(16,16,20,0.96)", border: `1px solid ${T.borderLight}`, borderRadius: 9, padding: "6px 12px", pointerEvents: "none", whiteSpace: "nowrap", zIndex: 10, boxShadow: "0 4px 16px rgba(0,0,0,0.4)" }}>
      {xFormat && <div style={{ fontSize: 10, color: T.textTer, marginBottom: 2 }}>{xFormat(hover)}</div>}
      <div style={{ fontSize: 14, fontWeight: 700, color, fontVariantNumeric: "tabular-nums" }}>{yFormat ? yFormat(data[hover]) : fmt(data[hover], 0)}</div>
      {bands && bands.map((b, bi) => b[hover] !== undefined && (<div key={bi} style={{ fontSize: 11, color: bi === 0 ? T.green : T.red }}>{bi === 0 ? "+1%: " : "−1%: "}{yFormat ? yFormat(b[hover]) : fmt(b[hover], 0)}</div>))}
    </div>
  );

  const chartContent = (
    <div style={{ position: "relative" }} onMouseLeave={() => setHover(null)}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        {title && <div style={{ fontSize: fs ? 13 : 10.5, color: T.textTer, textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 600 }}>{title}</div>}
        <button onClick={(e) => { e.stopPropagation(); setFs(!fs); }} style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${T.border}`, borderRadius: 6, padding: "3px 8px", color: T.textSec, cursor: "pointer", fontSize: 11 }}>{fs ? "✕ Lukk" : "⛶ Fullskjerm"}</button>
      </div>
      {svgContent}
      {tooltip}
    </div>
  );

  if (fs) return (<div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.95)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 30 }} onClick={() => setFs(false)}><div style={{ maxWidth: 900, width: "100%", background: T.surface, borderRadius: 20, padding: 28, border: `1px solid ${T.border}` }} onClick={e => e.stopPropagation()}>{chartContent}</div></div>);
  return chartContent;
}

function MultiLineChart({ datasets, width = 360, height = 100, labels }) {
  if (!datasets?.length) return null;
  const all = datasets.flatMap(d => d.data);
  const mx = Math.max(...all), mn = Math.min(...all, 0), rng = mx - mn || 1;
  return (<div><svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ display: "block" }}>
    {datasets.map((d, di) => { const pts = d.data.map((v, i) => `${(i / (d.data.length - 1)) * width},${height - ((v - mn) / rng) * (height - 8) - 4}`).join(" ");
      return <g key={di}><polyline points={pts} fill="none" stroke={d.color} strokeWidth={di === 0 ? "2.5" : "2"} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={d.dashed ? "6,4" : "none"} /></g>; })}</svg>
    {labels && <div style={{ display: "flex", gap: 14, marginTop: 8, flexWrap: "wrap" }}>{datasets.map((d, i) => <div key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}><div style={{ width: 12, height: 3, borderRadius: 2, background: d.color }} /><span style={{ fontSize: 11, color: T.textSec }}>{d.label}</span></div>)}</div>}</div>);
}

function seededRandom(seed) { let s = seed; return () => { s = (s * 16807) % 2147483647; return Math.max(0.0001, s / 2147483647); }; }
function boxMuller(rng) { const u1 = Math.max(0.0001, rng()); const u2 = rng(); return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2); }

// ══════════════════════════════════════
// TOOL 1: Compound (no tax, ±1% bands)
// ══════════════════════════════════════
function CompoundCalc() {
  const [init, setInit] = useState(500000);
  const [mth, setMth] = useState(5000);
  const [rate, setRate] = useState(8);
  const [yrs, setYrs] = useState(20);
  const [infl, setInfl] = useState(2.5);

  const r = useMemo(() => {
    const months = yrs * 12;
    const sampleEvery = Math.max(1, Math.floor(months / 80));
    const calc = (rt) => { const mr = rt / 100 / 12; let b = init; const cd = [b]; for (let m = 1; m <= months; m++) { b = b * (1 + mr) + mth; if (m % sampleEvery === 0) cd.push(b); } return { final: b, cd }; };
    const main = calc(rate);
    const hi = calc(rate + 1);
    const lo = calc(Math.max(0, rate - 1));
    // Ensure all arrays same length
    const len = main.cd.length;
    while (hi.cd.length < len) hi.cd.push(hi.cd[hi.cd.length - 1] || 0);
    while (lo.cd.length < len) lo.cd.push(lo.cd[lo.cd.length - 1] || 0);
    hi.cd.length = len; lo.cd.length = len;
    const contrib = init + mth * 12 * yrs;
    const gain = main.final - contrib;
    const realVal = main.final / Math.pow(1 + infl / 100, yrs);
    const yd = [];
    let b = init, c = init;
    for (let y = 1; y <= yrs; y++) { for (let m = 0; m < 12; m++) { b = b * (1 + rate / 100 / 12) + mth; c += mth; } yd.push({ y, b, c }); }
    return { ...main, hi: hi.cd, lo: lo.cd, contrib, gain, realVal, yd, rr: ((1 + rate / 100) / (1 + infl / 100) - 1) };
  }, [init, mth, rate, yrs, infl]);

  return (<div>
    <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1.15fr", gap: 28 }}>
      <div><SL>Parametere</SL>
        <Slider label="Startbeløp" value={init} onChange={setInit} min={0} max={10000000} step={50000} format={v => fmtKr(v)} />
        <Slider label="Månedlig sparing" value={mth} onChange={setMth} min={0} max={100000} step={500} format={v => fmtKr(v)} />
        <Slider label="Forventet avkastning" value={rate} onChange={setRate} min={0} max={20} step={0.25} suffix=" %" />
        <Slider label="Tidshorisont" value={yrs} onChange={setYrs} min={1} max={50} suffix=" år" decimals={0} />
        <Slider label="Inflasjon" value={infl} onChange={setInfl} min={0} max={8} step={0.25} suffix=" %" />
      </div>
      <div><SL>Resultat</SL>
        <div className="stat-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
          <StatBox label="Sluttverdi" value={fmtKr(r.final)} color={T.accent} />
          <StatBox label="Innbetalt" value={fmtKr(r.contrib)} color={T.textSec} />
          <StatBox label="Gevinst" value={fmtKr(r.gain)} color={T.green} sub={`${fmtPct((r.gain / r.contrib) * 100)} avkastning`} />
          <StatBox label="Realverdi" value={fmtKr(r.realVal)} color={T.teal} sub={`Realavk.: ${fmtPct(r.rr * 100)}`} />
        </div>
        <CB style={{ padding: 12 }}>
          <IChart data={r.cd} bands={[r.hi, r.lo]} bandColors={["rgba(48,209,88,0.12)", "rgba(255,69,58,0.12)"]} color={T.accent} title={`Verdiutvikling — ±1% sensitivitet`} yFormat={v => fmtKr(v)} xFormat={i => `${Math.round(i / r.cd.length * yrs)} år`} height={140} />
          <div style={{ display: "flex", gap: 14, marginTop: 6 }}>
            {[{ l: `${fmtPct(rate)} (hoved)`, c: T.accent }, { l: `+1% (${fmtPct(rate + 1)})`, c: T.green }, { l: `−1% (${fmtPct(rate - 1)})`, c: T.red }].map(x => (
              <div key={x.l} style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 10, height: 3, borderRadius: 2, background: x.c }} /><span style={{ fontSize: 10, color: T.textTer }}>{x.l}</span></div>))}
          </div>
        </CB>
      </div>
    </div>
    {r.yd.length > 0 && <div style={{ marginTop: 22, overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
      <thead><tr style={{ borderBottom: `1px solid ${T.border}` }}>{["År", "Verdi", "Innbetalt", "Gevinst", "%"].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
      <tbody>{r.yd.filter((_, i, a) => i % Math.max(1, Math.floor(a.length / 15)) === 0 || i === a.length - 1).map(d => (
        <tr key={d.y} style={{ borderBottom: `1px solid ${T.border}` }}><Td sec>{d.y}</Td><Td bold>{fmtKr(d.b)}</Td><Td sec>{fmtKr(d.c)}</Td><Td color={T.green}>{fmtKr(d.b - d.c)}</Td><Td color={T.green}>{d.c > 0 ? fmtPct(((d.b - d.c) / d.c) * 100) : "—"}</Td></tr>))}</tbody></table></div>}
  </div>);
}

// ══════════════════════════════════════
// TOOL 2: Wealth Planner — 5 profiles
// ══════════════════════════════════════
function WealthPlanner() {
  const [port, setPort] = useState(10000000);
  const [costBasis, setCostBasis] = useState(6000000);
  const [expense, setExpense] = useState(600000);
  const [infl, setInfl] = useState(2.5);
  const [wTax, setWTax] = useState(true);
  const [riskP, setRiskP] = useState("Moderat");
  const [isASK, setIsASK] = useState(true);

  const profiles = {
    "Veldig defensiv": { pm: 60, re: 30, kr: 10, ak: 0 },
    "Defensiv": { pm: 30, re: 25, kr: 15, ak: 30 },
    "Moderat": { pm: 10, re: 25, kr: 15, ak: 50 },
    "Offensiv": { pm: 0, re: 10, kr: 10, ak: 80 },
    "Veldig offensiv": { pm: 0, re: 0, kr: 0, ak: 100 },
  };
  const returns = { pm: 3.5, re: 4.5, kr: 6.25, ak: 7.25 };
  const prof = profiles[riskP];
  const expRet = (prof.pm * returns.pm + prof.re * returns.re + prof.kr * returns.kr + prof.ak * returns.ak) / 100;
  const vol = (prof.ak * 16 + prof.kr * 6 + prof.re * 3 + prof.pm * 0.5) / 100;
  const volPct = vol / 100;

  // Aksjeandel for differensiert skatt
  const aksjePct = prof.ak / 100;
  const rentePct = 1 - aksjePct;
  // Blended skattesats: aksjegevinst 37.84%, rentegevinst 22%
  const blendedSkatt = aksjePct * EFF_SKATT + rentePct * SKATT_ALM;

  const result = useMemo(() => {
    const maxY = 60;
    const calcWT = (bal) => {
      if (!wTax || bal <= 0) return 0;
      const tv = bal * (1 - VERDI_RABATT * aksjePct);
      const above = Math.max(0, tv - FORMUE_BUNN);
      return Math.min(above, 20000000 - FORMUE_BUNN) * FORMUE_S1 + Math.max(0, above - (20000000 - FORMUE_BUNN)) * FORMUE_S2;
    };

    let bal = port, cb = costBasis, exp = expense, cumSkj = 0, totalSkjEarned = 0, totTax = 0, totWT = 0;
    const data = [bal]; let depYear = null;
    let firstYearNetto = 0, lastYearNetto = 0;
    for (let y = 1; y <= maxY; y++) {
      const yearSkj = cb * SKJERMINGSRENTE;
      cumSkj += yearSkj;
      totalSkjEarned += yearSkj;
      const wt = calcWT(bal); totWT += wt;
      bal *= (1 + expRet / 100);
      const gp = bal > cb && bal > 0 ? (bal - cb) / bal : 0;
      const wg = exp * gp;
      let wtx = 0;
      if (isASK) {
        const su = Math.min(cumSkj, wg);
        wtx = Math.max(0, wg - su) * blendedSkatt;
        cumSkj = Math.max(0, cumSkj - su);
      } else {
        wtx = wg * blendedSkatt;
      }
      totTax += wtx;
      const nettoUttak = exp - wtx - wt;
      if (y === 1) firstYearNetto = nettoUttak;
      if (bal > 0) lastYearNetto = nettoUttak;
      cb = Math.max(0, cb - exp * (1 - gp));
      bal -= (exp + wt + wtx);
      exp *= (1 + infl / 100);
      if (bal <= 0 && !depYear) { depYear = y; bal = 0; }
      data.push(Math.max(0, bal));
    }

    // Monte Carlo always on
    const pData = { p10: [], p25: [], p50: [], p75: [], p90: [] };
    const N = 500, mu = expRet / 100;
    const allB = Array.from({ length: maxY + 1 }, () => []);
    for (let s = 0; s < N; s++) {
      const rng = seededRandom(42 + s * 7919);
      let sb = port, se = expense, scb = costBasis, scum = 0;
      allB[0].push(sb);
      for (let y = 1; y <= maxY; y++) {
        const r = mu + volPct * boxMuller(rng);
        if (!isFinite(r)) { allB[y].push(sb); continue; }
        scum += scb * SKJERMINGSRENTE;
        const swt = calcWT(sb);
        sb *= (1 + r);
        const gp = sb > scb && sb > 0 ? (sb - scb) / sb : 0;
        const wg = se * gp;
        const su = isASK ? Math.min(scum, wg) : 0;
        const wtx = Math.max(0, wg - su) * blendedSkatt;
        if (isASK) scum = Math.max(0, scum - su);
        scb = Math.max(0, scb - se * (1 - gp));
        sb = Math.max(0, sb - se - swt - wtx);
        se *= (1 + infl / 100);
        allB[y].push(sb);
      }
    }
    for (let y = 0; y <= maxY; y++) { const sorted = allB[y].filter(v => isFinite(v)).sort((a, b) => a - b); if (sorted.length === 0) { pData.p10.push(0); pData.p25.push(0); pData.p50.push(0); pData.p75.push(0); pData.p90.push(0); continue; } const p = v => sorted[Math.min(Math.floor(v * sorted.length), sorted.length - 1)]; pData.p10.push(p(0.1)); pData.p25.push(p(0.25)); pData.p50.push(p(0.5)); pData.p75.push(p(0.75)); pData.p90.push(p(0.9)); }

    return { data, depYear, pData, maxY, totTax, totWT, cumSkj, totalSkjEarned, firstYearNetto, lastYearNetto };
  }, [port, costBasis, expense, expRet, infl, wTax, riskP, isASK, volPct, aksjePct, blendedSkatt]);

  return (<div>
    <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1.15fr", gap: 28 }}>
      <div><SL>Parametere</SL>
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 13, color: T.textSec, marginBottom: 8 }}>Risikoprofil</div>
          <div className="profile-buttons" style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {Object.keys(profiles).map(k => (
              <button key={k} onClick={() => setRiskP(k)} style={{ padding: "8px 10px", border: `1px solid ${riskP === k ? T.accent : T.border}`, borderRadius: 8, background: riskP === k ? T.accentGlow : "transparent", color: riskP === k ? T.accent : T.textSec, cursor: "pointer", fontSize: 11, fontWeight: 600, transition: "all 0.2s" }}>{k}</button>))}
          </div>
          <div style={{ marginTop: 8, fontSize: 11, color: T.textTer }}>
            {prof.ak > 0 && `Aksjer ${prof.ak}%`}{prof.kr > 0 && ` · Kreditt ${prof.kr}%`}{prof.re > 0 && ` · Renter ${prof.re}%`}{prof.pm > 0 && ` · Pengemarked ${prof.pm}%`} · Forv. avk. {fmtPct(expRet)} · Vol. ±{fmtPct(vol / 100 * 100, 0)}
          </div>
        </div>
        <Slider label="Porteføljeverdi" value={port} onChange={setPort} min={500000} max={100000000} step={500000} format={v => fmtKr(v)} />
        <Slider label="Kostpris (innbetalt)" value={costBasis} onChange={setCostBasis} min={0} max={port} step={100000} format={v => fmtKr(v)} />
        <Slider label="Årlig forbruk" value={expense} onChange={setExpense} min={100000} max={3000000} step={25000} format={v => fmtKr(v)} />
        <Slider label="Inflasjon" value={infl} onChange={setInfl} min={0} max={8} step={0.25} suffix=" %" />
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
          <Toggle label="Aksjesparekonto (ASK)" value={isASK} onChange={setIsASK} />
          <Toggle label="Inkluder formuesskatt" value={wTax} onChange={setWTax} />
        </div>
      </div>
      <div><SL>Prognose <span style={{ fontSize: 12, fontWeight: 400, color: T.teal }}>(Monte Carlo, 500 sim.)</span></SL>
        <div style={{ background: result.depYear ? T.redGlow : T.greenGlow, border: `1px solid ${result.depYear ? "rgba(248,113,113,0.15)" : "rgba(52,211,153,0.15)"}`, borderRadius: 16, padding: 18, marginBottom: 16, textAlign: "center" }}>
          <div style={{ fontSize: 13, color: T.textSec, marginBottom: 2 }}>Porteføljen varer i</div>
          <div style={{ fontSize: 34, fontWeight: 800, color: result.depYear ? T.red : T.green }}>{result.depYear ? `${result.depYear} år` : "60+ år"}</div>
        </div>
        <div className="stat-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
          <StatBox label="Uttaksrate" value={fmtPct((expense / port) * 100)} color={T.textSec} />
          <StatBox label="Netto uttak år 1" value={fmtKr(result.firstYearNetto)} color={T.green} sub={`Brutto: ${fmtKr(expense)}`} />
          <StatBox label="Eff. skattesats" value={fmtPct(blendedSkatt * 100)} color={T.orange} sub={`Aksje: ${fmtPct(EFF_SKATT * 100)} · Rente: ${fmtPct(SKATT_ALM * 100)}`} />
          <StatBox label="Skjerming (opptjent)" value={fmtKr(result.totalSkjEarned)} color={T.teal} sub={`Gjenstår: ${fmtKr(result.cumSkj)} · ${fmtPct(SKJERMINGSRENTE * 100)}/år`} />
          <StatBox label="Total skatt" value={fmtKr(result.totTax + result.totWT)} color={T.red} sub={`Uttak: ${fmtKr(result.totTax)} · Formue: ${fmtKr(result.totWT)}`} />
          <StatBox label="Årlig forbruk (brutto)" value={fmtKr(expense)} color={T.textSec} sub={`+ ${fmtPct(infl)} inflasjon/år`} />
        </div>
        <CB style={{ padding: 12 }}>
          <MCChart data={result.pData} det={result.data} width={380} height={140} maxY={result.maxY} />
        </CB>
      </div>
    </div>
    <div style={{ marginTop: 18, padding: 14, background: T.surfaceAlt, borderRadius: 12, border: `1px solid ${T.border}` }}>
      <div style={{ fontSize: 11, color: T.textTer, lineHeight: 1.7 }}><strong style={{ color: T.textSec }}>Skattemodell ({isASK ? "ASK" : "VPS"}):</strong> {isASK ? "Skjermingsfradrag beregnes på innbetalt beløp (kostpris) × skjermingsrente (" + fmtPct(SKJERMINGSRENTE * 100) + "). Akkumuleres årlig og reduserer skattepliktig gevinst ved uttak." : "Skatt på gevinstdelen ved hvert uttak. Ingen skjermingsfradrag."} Aksjegevinst: {fmtPct(EFF_SKATT * 100)}. Rentegevinst: {fmtPct(SKATT_ALM * 100)}. Blandet sats ({prof.ak}% aksjer): {fmtPct(blendedSkatt * 100)}. Formuesskatt: {fmtPct(FORMUE_S1 * 100)}/{fmtPct(FORMUE_S2 * 100)}.</div>
    </div>
  </div>);
}

function MCChart({ data, det, width: baseW = 380, height: baseH = 140, maxY }) {
  const [hover, setHover] = useState(null);
  const [fs, setFs] = useState(false);
  const svgRef = useRef(null);

  const w = fs ? 700 : baseW;
  const h = fs ? 380 : baseH;
  const all = [...data.p10, ...data.p90, ...det].filter(v => isFinite(v));
  const mx = Math.max(...all), mn = 0, rng = mx || 1;
  const padL = fs ? 80 : 65, padR = 15, padT = 12, padB = 26;
  const cw = w - padL - padR, ch = h - padT - padB;
  const len = det.length;

  const toX = (i) => padL + (i / (len - 1)) * cw;
  const toY = (v) => padT + ch - ((v - mn) / rng) * ch;
  const path = (a) => a.map((v, i) => `${toX(i)},${toY(v)}`).join(" ");
  const area = (t, b) => `${t.map((v, i) => `${toX(i)},${toY(v)}`).join(" ")} ${[...b].reverse().map((v, i) => `${toX(b.length - 1 - i)},${toY(v)}`).join(" ")}`;

  const yTicks = fs ? 8 : 5;
  const yStep = rng / yTicks;
  const yVals = Array.from({ length: yTicks + 1 }, (_, i) => mn + i * yStep);
  const xTicks = fs ? 10 : 6;
  const xStep = Math.max(1, Math.floor(len / xTicks));
  const xIdxs = [];
  for (let i = 0; i < len; i += xStep) xIdxs.push(i);
  if (xIdxs[xIdxs.length - 1] !== len - 1) xIdxs.push(len - 1);

  const onMove = (e) => { const rect = svgRef.current?.getBoundingClientRect(); if (!rect) return; const relX = ((e.clientX - rect.left) / rect.width) * w; const idx = Math.round(((relX - padL) / cw) * (len - 1)); if (idx >= 0 && idx < len) setHover(idx); else setHover(null); };

  const svgContent = (
    <svg ref={svgRef} width="100%" viewBox={`0 0 ${w} ${h}`} style={{ display: "block", cursor: "crosshair" }} onMouseMove={onMove}>
      {yVals.map((v, i) => (<g key={i}><line x1={padL} y1={toY(v)} x2={w - padR} y2={toY(v)} stroke="rgba(255,255,255,0.04)" strokeWidth="1" /><text x={padL - 8} y={toY(v) + 3} textAnchor="end" fill={T.textTer} fontSize={fs ? "11" : "9"} fontFamily="system-ui">{fmtKr(v)}</text></g>))}
      {xIdxs.map(i => (<text key={i} x={toX(i)} y={h - 4} textAnchor="middle" fill={T.textTer} fontSize={fs ? "11" : "9"} fontFamily="system-ui">År {i}</text>))}
      <polygon points={area(data.p90, data.p10)} fill={T.accent} opacity="0.08" />
      <polygon points={area(data.p75, data.p25)} fill={T.accent} opacity="0.18" />
      <polyline points={path(data.p50)} fill="none" stroke={T.accent} strokeWidth="2" strokeLinecap="round" />
      <polyline points={path(det)} fill="none" stroke={T.text} strokeWidth="1.5" strokeLinecap="round" strokeDasharray="4,3" opacity="0.5" />
      {hover !== null && (<>
        <line x1={toX(hover)} y1={padT} x2={toX(hover)} y2={h - padB} stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeDasharray="3,3" />
        <circle cx={toX(hover)} cy={toY(det[hover])} r="4" fill={T.text} strokeWidth="1.5" />
        <circle cx={toX(hover)} cy={toY(data.p50[hover])} r="4" fill={T.accent} stroke={T.text} strokeWidth="1.5" />
      </>)}
    </svg>
  );

  const tooltip = hover !== null && (
    <div style={{ position: "absolute", top: 4, left: `${Math.min(Math.max((toX(hover) / w) * 100, 15), 80)}%`, transform: "translateX(-50%)", background: "rgba(16,16,20,0.96)", border: `1px solid ${T.borderLight}`, borderRadius: 9, padding: "6px 12px", pointerEvents: "none", whiteSpace: "nowrap", zIndex: 10, boxShadow: "0 4px 16px rgba(0,0,0,0.4)" }}>
      <div style={{ fontSize: 10, color: T.textTer, marginBottom: 2 }}>År {hover}</div>
      <div style={{ fontSize: 12, color: T.text, marginBottom: 1 }}>Determ.: <strong>{fmtKr(det[hover])}</strong></div>
      <div style={{ fontSize: 12, color: T.accent, marginBottom: 1 }}>Median: <strong>{fmtKr(data.p50[hover])}</strong></div>
      <div style={{ fontSize: 11, color: T.textTer }}>P25–P75: {fmtKr(data.p25[hover])} – {fmtKr(data.p75[hover])}</div>
      <div style={{ fontSize: 11, color: T.textTer }}>P10–P90: {fmtKr(data.p10[hover])} – {fmtKr(data.p90[hover])}</div>
    </div>
  );

  const chartContent = (
    <div style={{ position: "relative" }} onMouseLeave={() => setHover(null)}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ fontSize: fs ? 13 : 10.5, color: T.textTer, textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 600 }}>Monte Carlo — {maxY} år</div>
        <button onClick={(e) => { e.stopPropagation(); setFs(!fs); }} style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${T.border}`, borderRadius: 6, padding: "3px 8px", color: T.textSec, cursor: "pointer", fontSize: 11 }}>{fs ? "✕ Lukk" : "⛶ Fullskjerm"}</button>
      </div>
      {svgContent}
      {tooltip}
      <div style={{ display: "flex", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
        {[{ l: "Deterministisk", c: T.text }, { l: "Median (P50)", c: T.accent }, { l: "P25–P75", c: "rgba(41,151,255,0.3)" }, { l: "P10–P90", c: "rgba(41,151,255,0.12)" }].map(x => (
          <div key={x.l} style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 12, height: 4, borderRadius: 2, background: x.c }} /><span style={{ fontSize: 10, color: T.textTer }}>{x.l}</span></div>))}
      </div>
    </div>
  );

  if (fs) return (<div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.95)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 30 }} onClick={() => setFs(false)}><div style={{ maxWidth: 900, width: "100%", background: T.surface, borderRadius: 20, padding: 28, border: `1px solid ${T.border}` }} onClick={e => e.stopPropagation()}>{chartContent}</div></div>);
  return chartContent;
}

// ══════════════════════════════════════

// ══════════════════════════════════════
// TOOL 3: Kostnadseffekt
// ══════════════════════════════════════
function FeeImpact() {
  const [init, setInit] = useState(1000000);
  const [mth, setMth] = useState(5000);
  const [yrs, setYrs] = useState(30);
  const [gross, setGross] = useState(8);
  const [f1, setF1] = useState(0.15);
  const [f2, setF2] = useState(0.75);
  const [f3, setF3] = useState(1.50);
  const [plat, setPlat] = useState(0);
  const [showTbl, setShowTbl] = useState(false);

  const calc = useCallback(fee => {
    const nr = (gross - fee) / 100 / 12;
    let b = init;
    const d = [b], yl = [];
    let totalFeesPaid = 0;
    let prevB = init;
    for (let m = 1; m <= yrs * 12; m++) {
      b = b * (1 + nr) + mth;
      if (m % 12 === 0) {
        // Annual fees: approximate as fee% of average balance this year
        totalFeesPaid += ((prevB + b) / 2) * ((fee) / 100);
        prevB = b;
        yl.push(b);
        d.push(b);
      }
    }
    return { f: b, d, yl, totalFeesPaid };
  }, [init, mth, yrs, gross]);

  const r0 = useMemo(() => calc(0), [calc]);
  const r1 = useMemo(() => calc(f1), [calc, f1]);
  const r2 = useMemo(() => calc(f2), [calc, f2]);
  const r3 = useMemo(() => calc(f3), [calc, f3]);

  const totalInvested = init + mth * 12 * yrs;

  // Key metrics
  const lostToFees_1v3 = r1.f - r3.f;
  const lostPct_1v3 = r1.f > 0 ? (lostToFees_1v3 / r1.f) * 100 : 0;
  const feeCostMultiplier = (f3 - f1) > 0 ? lostToFees_1v3 / (totalInvested * (f3 - f1) / 100 * yrs) : 0;
  const extraYearsOfSaving = mth > 0 ? lostToFees_1v3 / (mth * 12) : 0;

  // How much of your return goes to fees
  const gain1 = r1.f - totalInvested;
  const gain3 = r3.f - totalInvested;
  const returnLostPct = gain1 > 0 ? ((gain1 - gain3) / gain1) * 100 : 0;

  // Effective total cost as % of end value
  const totalCostPct1 = r0.f > 0 ? ((r0.f - r1.f) / r0.f) * 100 : 0;
  const totalCostPct3 = r0.f > 0 ? ((r0.f - r3.f) / r0.f) * 100 : 0;

  const sc = [
    { l: "Ingen kostnad", fee: 0, r: r0, c: T.green },
    { l: `${fmtPct(f1)} TER`, fee: f1, r: r1, c: T.accent },
    { l: `${fmtPct(f2)} TER`, fee: f2, r: r2, c: T.orange },
    { l: `${fmtPct(f3)} TER`, fee: f3, r: r3, c: T.red },
  ];

  return (<div>
    <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1.15fr", gap: 28 }}>
      <div><SL>Parametere</SL>
        <Slider label="Startbeløp" value={init} onChange={setInit} min={0} max={10000000} step={50000} format={v => fmtKr(v)} />
        <Slider label="Månedlig sparing" value={mth} onChange={setMth} min={0} max={50000} step={500} format={v => fmtKr(v)} />
        <Slider label="Tidshorisont" value={yrs} onChange={setYrs} min={5} max={50} suffix=" år" decimals={0} />
        <Slider label="Brutto avkastning" value={gross} onChange={setGross} min={2} max={15} step={0.25} suffix=" %" />
        <div style={{ marginTop: 6, padding: 14, background: T.surfaceAlt, borderRadius: 12, border: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 11, color: T.textTer, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 10 }}>Forvaltningskostnader (TER)</div>
          <Slider label="Alt. A (indeksfond)" value={f1} onChange={setF1} min={0} max={1} step={0.01} suffix=" %" />
          <Slider label="Alt. B (aktivt fond)" value={f2} onChange={setF2} min={0} max={2} step={0.05} suffix=" %" />
          <Slider label="Alt. C (dyrt fond)" value={f3} onChange={setF3} min={0.5} max={3} step={0.05} suffix=" %" />
        </div>
      </div>

      <div>
        <SL>Hva koster det deg?</SL>

        {/* Hero: lost money */}
        <div style={{ background: T.redGlow, border: "1px solid rgba(255,69,58,0.15)", borderRadius: 16, padding: 22, marginBottom: 16, textAlign: "center" }}>
          <div style={{ fontSize: 13, color: T.textSec, marginBottom: 2 }}>Forskjellen mellom {fmtPct(f1)} og {fmtPct(f3)} over {yrs} år</div>
          <div style={{ fontSize: 42, fontWeight: 800, color: T.red, lineHeight: 1.1 }}>{fmtKr(lostToFees_1v3)}</div>
          <div style={{ fontSize: 13, color: T.textSec, marginTop: 6 }}>
            {fmtPct(lostPct_1v3, 0)} av porteføljens verdi — tapt til forvaltningskostnader
          </div>
        </div>

        {/* Key insights */}
        <div className="stat-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
          <StatBox
            label="Av din gevinst"
            value={fmtPct(returnLostPct, 0)}
            color={T.red}
            sub="spist av kostnadsforskjellen"
          />
          <StatBox
            label="Tilsvarer"
            value={`${fmt(extraYearsOfSaving, 1)} år`}
            color={T.orange}
            sub="ekstra sparing à 5 000/mnd"
          />
          <StatBox
            label="Samlet kostnad"
            value={fmtPct(totalCostPct3, 0)}
            color={T.red}
            sub={`av totalverdi (${fmtPct(f3)} TER)`}
          />
        </div>

        {/* Fund comparison boxes */}
        <div className="stat-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
          {sc.map(s => (
            <StatBox key={s.l} label={s.l} value={fmtKr(s.r.f)} color={s.c}
              sub={s.fee === 0 ? "Referanse" : `Tapt: ${fmtKr(r0.f - s.r.f)} (${fmtPct((r0.f - s.r.f) / r0.f * 100, 0)})`} />
          ))}
        </div>

        {/* Chart */}
        <CB label="Verdiutvikling over tid" style={{ marginBottom: 14 }}>
          <MultiLineChart datasets={sc.map(s => ({ data: s.r.d, color: s.c, label: s.l }))} labels height={110} />
        </CB>

        {/* Analysis box */}
        <div style={{ padding: 16, background: "rgba(255,69,58,0.04)", borderRadius: 14, border: "1px solid rgba(255,69,58,0.1)", marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 8 }}>Hvorfor koster {fmtPct(f3 - f1)} ekstra så mye?</div>
          <div style={{ fontSize: 12.5, color: T.textSec, lineHeight: 1.8 }}>
            <div style={{ marginBottom: 6 }}>
              <strong style={{ color: T.orange }}>Rentes rente-effekten på kostnader:</strong> Du betaler ikke bare {fmtPct(f3 - f1)} mer i gebyr — du taper også all fremtidig avkastning på pengene som gikk til gebyr. Over {yrs} år vokser dette eksponentielt.
            </div>
            <div style={{ marginBottom: 6 }}>
              <strong style={{ color: T.red }}>Konkret:</strong> Med {fmtPct(f3)} TER betaler du totalt <strong>{fmtKr(r3.totalFeesPaid)}</strong> i direkte gebyrer over {yrs} år. Men den reelle kostnaden er <strong>{fmtKr(r0.f - r3.f)}</strong> — fordi gebyrene også mistet avkastning.
            </div>
            <div>
              <strong style={{ color: T.accent }}>Tommelregel:</strong> Hver {fmtPct(0.1)} i årlig kostnad reduserer sluttverdi med ca. {fmtPct((1 - Math.pow((1 + (gross - 0.1) / 100) / (1 + gross / 100), yrs)) * 100, 0)} over {yrs} år. Kostnad er den eneste faktoren du kan kontrollere — avkastning er usikker, men gebyr er garantert.
            </div>
          </div>
        </div>

        {/* Year-by-year breakdown toggle */}
        <button onClick={() => setShowTbl(!showTbl)} style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 8, padding: "8px 14px", color: T.textSec, cursor: "pointer", fontSize: 12, fontWeight: 500, width: "100%" }}>
          {showTbl ? "Skjul" : "Vis"} årlig tabell ▾
        </button>
      </div>
    </div>

    {showTbl && (
      <div style={{ marginTop: 20, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
          <thead><tr style={{ borderBottom: `1px solid ${T.border}` }}>
            <th style={thS}>År</th>
            <th style={thS}>Ingen kost.</th>
            <th style={{ ...thS, color: T.accent }}>{fmtPct(f1)} TER</th>
            <th style={{ ...thS, color: T.orange }}>{fmtPct(f2)} TER</th>
            <th style={{ ...thS, color: T.red }}>{fmtPct(f3)} TER</th>
            <th style={{ ...thS, color: T.red }}>Tapt (A vs C)</th>
            <th style={{ ...thS, color: T.orange }}>Tapt % av verdi</th>
          </tr></thead>
          <tbody>
            {r0.yl.filter((_, i) => i % Math.max(1, Math.floor(yrs / 10)) === 0 || i === r0.yl.length - 1).map((_, fi, arr) => {
              const i = fi === arr.length - 1 ? r0.yl.length - 1 : fi * Math.max(1, Math.floor(yrs / 10));
              const lost = r1.yl[i] - r3.yl[i];
              const lostPct = r1.yl[i] > 0 ? (lost / r1.yl[i]) * 100 : 0;
              return (
                <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                  <Td sec>{i + 1}</Td>
                  <Td bold>{fmtKr(r0.yl[i])}</Td>
                  <Td color={T.accent}>{fmtKr(r1.yl[i])}</Td>
                  <Td color={T.orange}>{fmtKr(r2.yl[i])}</Td>
                  <Td color={T.red}>{fmtKr(r3.yl[i])}</Td>
                  <Td color={T.red}>{fmtKr(lost)}</Td>
                  <Td color={T.orange}>{fmtPct(lostPct)}</Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    )}

    <div style={{ marginTop: 18, padding: 16, background: T.surfaceAlt, borderRadius: 12, border: `1px solid ${T.border}` }}>
      <div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.8 }}>
        <strong style={{ color: T.text }}>Oppsummert:</strong> Forvaltningskostnader er den viktigste kontrollerbare faktoren for langsiktig avkastning. Forskning viser at billige indeksfond slår majoriteten av aktive fond over 10+ år — nettopp fordi kostnadene spiser opp meravkastningen. Som Warren Buffett sa: <em style={{ color: T.textTer }}>"Performance comes and goes, but costs roll on forever."</em>
      </div>
    </div>
  </div>);
}


// ══════════════════════════════════════
// TOOL 4: FIRE
// ══════════════════════════════════════
function FIRE() {
  const [age, setAge] = useState(35);
  const [arligSparing, setArligSparing] = useState(250000);
  const [sparebeholdning, setSparebeholdning] = useState(1500000);
  const [arligForbruk, setArligForbruk] = useState(450000);
  const [ret, setRet] = useState(7);
  const [infl, setInfl] = useState(2.5);

  // Calculate FIRE number for different SWR scenarios
  const swrScenarios = [3, 3.5, 4];
  const fireNumbers = swrScenarios.map(swr => ({ swr, target: arligForbruk / (swr / 100) }));

  // Build growth chart to each target
  const results = fireNumbers.map(({ swr, target }) => {
    let y = 0, b = sparebeholdning;
    const cd = [b];
    while (b < target && y < 80) { b = b * (1 + ret / 100) + arligSparing; y++; cd.push(b); }
    return { swr, target, years: y, fireAge: age + y, cd, reached: y < 80 };
  });

  const main = results.find(r => r.swr === 3.5) || results[1];
  const sr = (arligSparing + arligForbruk) > 0 ? (arligSparing / (arligSparing + arligForbruk)) * 100 : 0;
  const realRet = ((1 + ret / 100) / (1 + infl / 100) - 1) * 100;

  // How much could you withdraw per year at FIRE
  const sustainableWithdrawal_3 = sparebeholdning > 0 ? sparebeholdning * 0.03 : 0;
  const sustainableWithdrawal_4 = sparebeholdning > 0 ? sparebeholdning * 0.04 : 0;

  return (<div><div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1.15fr", gap: 28 }}>
    <div><SL>Din situasjon</SL>
      <Slider label="Alder" value={age} onChange={setAge} min={18} max={65} suffix=" år" decimals={0} />
      <Slider label="Nåværende sparebeholdning" value={sparebeholdning} onChange={setSparebeholdning} min={0} max={20000000} step={100000} format={v => fmtKr(v)} />
      <Slider label="Årlig sparing" value={arligSparing} onChange={setArligSparing} min={0} max={1000000} step={10000} format={v => fmtKr(v)} />
      <Slider label="Årlig forbruk i FIRE" value={arligForbruk} onChange={setArligForbruk} min={100000} max={2000000} step={25000} format={v => fmtKr(v)} />
      <Slider label="Forventet avkastning" value={ret} onChange={setRet} min={0} max={15} step={0.25} suffix=" %" />
      <Slider label="Inflasjon" value={infl} onChange={setInfl} min={0} max={8} step={0.25} suffix=" %" />
    </div>
    <div><SL>FIRE-analyse</SL>
      <div style={{ background: main.reached ? T.greenGlow : T.orangeGlow, border: `1px solid ${main.reached ? "rgba(52,211,153,0.15)" : "rgba(251,191,36,0.15)"}`, borderRadius: 16, padding: 20, marginBottom: 16, textAlign: "center" }}>
        <div style={{ fontSize: 13, color: T.textSec, marginBottom: 2 }}>Økonomisk uavhengig ved</div>
        <div style={{ fontSize: 42, fontWeight: 800, color: main.reached ? T.green : T.orange, lineHeight: 1.1 }}>{main.reached ? `${main.fireAge} år` : "80+"}</div>
        <div style={{ fontSize: 13, color: T.textSec, marginTop: 6 }}>{main.reached ? `${main.years} år fra nå · 3,5% uttaksrate` : "Juster parametere"}</div>
      </div>

      <div className="stat-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
        <StatBox label="FIRE-tall (3,5%)" value={fmtKr(main.target)} color={T.accent} sub={`${fmtPct(3.5)} uttaksrate`} />
        <StatBox label="Sparerate" value={fmtPct(sr)} color={sr >= 50 ? T.green : sr >= 30 ? T.orange : T.red} sub={`${fmtKr(arligSparing / 12)}/mnd`} />
        <StatBox label="Gjenstår" value={fmtKr(Math.max(0, main.target - sparebeholdning))} color={T.textSec} sub={`Realavk.: ${fmtPct(realRet)}`} />
      </div>

      {/* SWR scenario comparison */}
      <CB label="Uttaksrate-scenarier" style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {results.map(r => (
            <div key={r.swr} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", borderRadius: 9, background: r.swr === 3.5 ? T.accentGlow : "transparent", border: `1px solid ${r.swr === 3.5 ? "rgba(77,163,255,0.2)" : T.border}` }}>
              <div>
                <span style={{ fontSize: 13, fontWeight: 600, color: r.swr === 3.5 ? T.accent : T.text }}>{fmtPct(r.swr)} uttaksrate</span>
                <span style={{ fontSize: 11, color: T.textTer, marginLeft: 8 }}>FIRE-tall: {fmtKr(r.target)}</span>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: r.reached ? T.green : T.orange }}>{r.reached ? `${r.fireAge} år` : "80+"}</span>
                <span style={{ fontSize: 11, color: T.textTer, marginLeft: 6 }}>{r.reached ? `${r.years} år` : ""}</span>
              </div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 11, color: T.textTer, marginTop: 8, lineHeight: 1.6 }}>
          <strong style={{ color: T.textSec }}>3%</strong> = konservativ (historisk trygg). <strong style={{ color: T.textSec }}>3,5%</strong> = moderat. <strong style={{ color: T.textSec }}>4%</strong> = Trinity Study-regelen (30+ år horisont).
        </div>
      </CB>

      <CB style={{ padding: 12 }}><IChart data={main.cd} color={T.green} title={`Vei til FIRE (${fmtPct(3.5)} uttaksrate)`} yFormat={v => fmtKr(v)} xFormat={i => `${age + i} år`} height={120} /></CB>
    </div>
  </div></div>);
}

// ══════════════════════════════════════
// TOOL 5: Loan Calculator (full)
// ══════════════════════════════════════
function Loan() {
  const [la, setLa] = useState(4000000); const [nom, setNom] = useState(4.5); const [ly, setLy] = useState(25);
  const [ep, setEp] = useState(0); const [lt, setLt] = useState("annuitet"); const [termFee, setTermFee] = useState(50);
  const [showPlan, setShowPlan] = useState(false);

  const r = useMemo(() => {
    const mr = nom / 100 / 12, tm = ly * 12;
    let bal = la, totInt = 0, mp;
    const plan = [];
    const cd = [la];

    if (lt === "annuitet") {
      mp = mr > 0 ? la * (mr * Math.pow(1 + mr, tm)) / (Math.pow(1 + mr, tm) - 1) : la / tm;
      for (let m = 1; m <= tm && bal > 0; m++) {
        const interest = bal * mr;
        const principal = Math.min(bal, mp + ep - interest);
        bal = Math.max(0, bal - principal);
        totInt += interest;
        plan.push({ m, interest, principal, payment: interest + principal + termFee, bal });
        if (m % 12 === 0) cd.push(bal);
      }
    } else {
      const mPrincipal = la / tm;
      mp = mPrincipal + la * mr;
      for (let m = 1; m <= tm && bal > 0; m++) {
        const interest = bal * mr;
        const principal = mPrincipal + ep;
        bal = Math.max(0, bal - principal);
        totInt += interest;
        plan.push({ m, interest, principal, payment: interest + principal + termFee, bal });
        if (m % 12 === 0) cd.push(bal);
      }
    }

    // Effective rate (includes termFee)
    const totalPaidWithFees = plan.reduce((s, p) => s + p.payment, 0);
    // Newton's method for effective rate
    let effRate = nom / 100 / 12;
    for (let iter = 0; iter < 50; iter++) {
      let pv = 0, dpv = 0;
      const pmt = totalPaidWithFees / plan.length;
      for (let m = 1; m <= plan.length; m++) {
        const disc = Math.pow(1 + effRate, -m);
        pv += pmt * disc;
        dpv += -m * pmt * disc / (1 + effRate);
      }
      const f = pv - la;
      if (Math.abs(f) < 0.01) break;
      effRate -= f / dpv;
    }
    const effAnnual = (Math.pow(1 + effRate, 12) - 1) * 100;

    return { mp: mp + termFee, totInt, taxSave: totInt * SKATT_ALM, effCost: totInt * (1 - SKATT_ALM), totPaid: la + totInt, cd, plan, effAnnual };
  }, [la, nom, ly, ep, lt, termFee]);

  return (<div>
    <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1.15fr", gap: 28 }}>
      <div><SL>Parametere</SL>
        <div style={{ marginBottom: 18 }}><div style={{ fontSize: 13, color: T.textSec, marginBottom: 8 }}>Lånetype</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>{[["annuitet", "Annuitetslån"], ["serie", "Serielån"]].map(([k, l]) => <button key={k} onClick={() => setLt(k)} style={{ padding: "9px", border: `1px solid ${lt === k ? T.accent : T.border}`, borderRadius: 9, background: lt === k ? T.accentGlow : "transparent", color: lt === k ? T.accent : T.textSec, cursor: "pointer", fontSize: 12.5, fontWeight: 600 }}>{l}</button>)}</div></div>
        <Slider label="Lånebeløp" value={la} onChange={setLa} min={500000} max={15000000} step={100000} format={v => fmtKr(v)} />
        <Slider label="Nominell rente" value={nom} onChange={setNom} min={1} max={10} step={0.10} suffix=" %" />
        <Slider label="Nedbetalingstid" value={ly} onChange={setLy} min={5} max={35} suffix=" år" decimals={0} />
        <Slider label="Termingebyr" value={termFee} onChange={setTermFee} min={0} max={100} step={5} format={v => `${v} kr/mnd`} />
        <Slider label="Ekstra nedbetaling/mnd" value={ep} onChange={setEp} min={0} max={20000} step={500} format={v => fmtKr(v)} /></div>
      <div><SL>Oversikt</SL>
        <div className="stat-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
          <StatBox label="Terminbeløp" value={fmtKr(r.mp)} color={T.accent} sub={`Avdrag + renter + ${termFee} kr gebyr`} />
          <StatBox label="Effektiv rente" value={fmtPct(r.effAnnual)} color={r.effAnnual > nom ? T.orange : T.accent} sub={`Nominell: ${fmtPct(nom)}`} />
          <StatBox label="Total rentekostnad" value={fmtKr(r.totInt)} color={T.red} />
          <StatBox label="Skattefradrag (22%)" value={fmtKr(r.taxSave)} color={T.green} sub={`Eff. kostnad: ${fmtKr(r.effCost)}`} />
        </div>
        <CB style={{ padding: 12 }}><IChart data={r.cd} color={T.accent} title="Restgjeld over tid" yFormat={v => fmtKr(v)} xFormat={i => `År ${i}`} height={100} /></CB>
        <button onClick={() => setShowPlan(!showPlan)} style={{ marginTop: 12, background: "none", border: `1px solid ${T.border}`, borderRadius: 8, padding: "7px 14px", color: T.textSec, cursor: "pointer", fontSize: 12, fontWeight: 500, width: "100%" }}>{showPlan ? "Skjul" : "Vis"} nedbetalingsplan ▾</button></div>
    </div>
    {showPlan && <div style={{ marginTop: 20, overflowX: "auto", maxHeight: 400, overflowY: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
      <thead style={{ position: "sticky", top: 0, background: T.surface }}><tr style={{ borderBottom: `1px solid ${T.border}` }}>
        <th style={thS}>Mnd</th><th style={thS}>Terminbeløp</th><th style={thS}>Renter</th><th style={thS}>Avdrag</th><th style={thS}>Restgjeld</th>
      </tr></thead>
      <tbody>{r.plan.filter((_, i) => i % Math.max(1, Math.floor(r.plan.length / 50)) === 0 || i === r.plan.length - 1).map(p => (
        <tr key={p.m} style={{ borderBottom: `1px solid ${T.border}` }}>
          <Td sec>{p.m}</Td><Td bold>{fmtKr(p.payment)}</Td><Td color={T.red}>{fmtKr(p.interest)}</Td><Td color={T.green}>{fmtKr(p.principal)}</Td><Td>{fmtKr(p.bal)}</Td>
        </tr>))}</tbody></table></div>}
  </div>);
}

// ══════════════════════════════════════
// TOOL 6: Market Pulse (manual data, info tooltips)
// ══════════════════════════════════════
function Rebalancer() {
  // === Hva du har i dag ===
  const [askVerdi, setAskVerdi] = useState(5000000);
  const [askKostpris, setAskKostpris] = useState(3000000);
  const [fkRenter, setFkRenter] = useState(1000000);
  const [fkAksjer, setFkAksjer] = useState(0);
  const [targetEq, setTargetEq] = useState(50);

  // Beregninger — i dag
  const askGevinst = Math.max(0, askVerdi - askKostpris);
  const totalVerdi = askVerdi + fkRenter + fkAksjer;
  const totalAksjer = askVerdi + fkAksjer; // ASK = 100% aksjer i dag
  const totalRenter = fkRenter;
  const aktuellPct = totalVerdi > 0 ? (totalAksjer / totalVerdi) * 100 : 0;
  const diff = aktuellPct - targetEq;

  // Målberegning
  const målAksjer = totalVerdi * (targetEq / 100);
  const målRenter = totalVerdi - målAksjer;
  const måFlytte = totalAksjer - målAksjer; // positivt = må redusere aksjer

  // === Strategier for å nå mål (kun hvis vi har for mye aksjer) ===

  // Strategi A: Bytt til DNB Aktiv 80 i ASK (ingen uttak)
  // ASK gir da 80% aksjer. Ny total aksjer = askVerdi*0.8 + fkAksjer
  const sA_aksjer = askVerdi * 0.80 + fkAksjer;
  const sA_pct = totalVerdi > 0 ? (sA_aksjer / totalVerdi) * 100 : 0;

  // Strategi B: Ta ut kostpris skattefritt, plasser i rentefond
  const sB_uttak = askKostpris;
  const sB_askEtter = askVerdi - sB_uttak;
  const sB_aksjer = sB_askEtter + fkAksjer; // resten i ASK er fortsatt aksjer
  const sB_pct = totalVerdi > 0 ? (sB_aksjer / totalVerdi) * 100 : 0;

  // Strategi C: Kombiner — bytt ASK til 80% + ta ut kostpris til renter
  const sC_askEtter = askVerdi - askKostpris;
  const sC_aksjer = sC_askEtter * 0.80 + fkAksjer;
  const sC_pct = totalVerdi > 0 ? (sC_aksjer / totalVerdi) * 100 : 0;

  // Strategi D: Optimalt uttak (kan innebære skatt)
  // Vi vil: askEtter * askFondAndel + fkAksjer + (uttak til renter = 0 aksjer) = målAksjer
  // Prøv med 100% aksjefond i ASK først:
  // (askVerdi - uttak) * 1.0 + fkAksjer = målAksjer → uttak = askVerdi + fkAksjer - målAksjer
  let sD_uttak100 = totalAksjer - målAksjer;
  sD_uttak100 = Math.max(0, Math.min(askVerdi, sD_uttak100));
  const sD_skattefri100 = Math.min(sD_uttak100, askKostpris);
  const sD_skattbar100 = Math.max(0, sD_uttak100 - askKostpris);
  const sD_gevinstAndel = askVerdi > 0 ? askGevinst / askVerdi : 0;
  const sD_skatt100 = sD_skattbar100 * sD_gevinstAndel * EFF_SKATT;

  // Prøv med 80% kombifond i ASK:
  // (askVerdi - uttak) * 0.80 + fkAksjer = målAksjer → uttak = askVerdi - (målAksjer - fkAksjer) / 0.80
  let sD_uttak80 = fkAksjer < målAksjer ? askVerdi - (målAksjer - fkAksjer) / 0.80 : askVerdi;
  sD_uttak80 = Math.max(0, Math.min(askVerdi, sD_uttak80));
  const sD_skattefri80 = Math.min(sD_uttak80, askKostpris);
  const sD_skattbar80 = Math.max(0, sD_uttak80 - askKostpris);
  const sD_skatt80 = sD_skattbar80 * sD_gevinstAndel * EFF_SKATT;

  // Velg billigste
  const bruk80 = sD_skatt80 <= sD_skatt100;
  const sD_uttak = bruk80 ? sD_uttak80 : sD_uttak100;
  const sD_skatt = bruk80 ? sD_skatt80 : sD_skatt100;
  const sD_fond = bruk80 ? "DNB Aktiv 80" : "100% aksjefond";
  const sD_askEtter = askVerdi - sD_uttak;
  const sD_aksjer = sD_askEtter * (bruk80 ? 0.80 : 1.0) + fkAksjer;
  const sD_pct = (totalVerdi - sD_skatt) > 0 ? (sD_aksjer / (totalVerdi - sD_skatt)) * 100 : 0;

  const needsRebalance = Math.abs(diff) >= 2;
  const needsLess = diff > 0; // har for mye aksjer

  return (<div>
    <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1.15fr", gap: 28 }}>
      <div>
        <SL>I dag</SL>
        <div style={{ padding: 14, background: T.surfaceAlt, borderRadius: 12, border: `1px solid ${T.border}`, marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: T.accent, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 10 }}>Aksjesparekonto (ASK)</div>
          <Slider label="Markedsverdi" value={askVerdi} onChange={setAskVerdi} min={0} max={50000000} step={50000} format={v => fmtKr(v)} />
          <Slider label="Kostpris (skattefritt uttak)" value={askKostpris} onChange={setAskKostpris} min={0} max={askVerdi} step={50000} format={v => fmtKr(v)} />
          <div style={{ fontSize: 11, color: T.textTer, marginTop: -8 }}>Urealisert gevinst: {fmtKr(askGevinst)}</div>
        </div>

        <div style={{ padding: 14, background: T.surfaceAlt, borderRadius: 12, border: `1px solid ${T.border}`, marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: T.green, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 10 }}>Fondskonto</div>
          <Slider label="Rentefond" value={fkRenter} onChange={setFkRenter} min={0} max={20000000} step={50000} format={v => fmtKr(v)} />
          <Slider label="Aksjefond" value={fkAksjer} onChange={setFkAksjer} min={0} max={20000000} step={50000} format={v => fmtKr(v)} />
        </div>

        <Slider label="Ønsket aksjeandel" value={targetEq} onChange={setTargetEq} min={0} max={100} suffix=" %" decimals={0} />
      </div>

      <div>
        <SL>Oversikt</SL>

        {/* Hero stat */}
        <div style={{ background: Math.abs(diff) < 3 ? T.greenGlow : T.orangeGlow, border: `1px solid ${Math.abs(diff) < 3 ? "rgba(48,209,88,0.15)" : "rgba(255,159,10,0.15)"}`, borderRadius: 16, padding: 20, marginBottom: 16, textAlign: "center" }}>
          <div style={{ fontSize: 13, color: T.textSec }}>Din aksjeandel i dag</div>
          <div style={{ fontSize: 48, fontWeight: 800, color: Math.abs(diff) < 3 ? T.green : T.orange, lineHeight: 1.1, marginTop: 4 }}>{fmtPct(aktuellPct, 0)}</div>
          <div style={{ fontSize: 14, color: T.textSec, marginTop: 6 }}>
            {Math.abs(diff) < 2 ? "✓ I mål!" : diff > 0 ? `${fmtPct(diff, 0)} over mål (${targetEq}%)` : `${fmtPct(Math.abs(diff), 0)} under mål (${targetEq}%)`}
          </div>
        </div>

        {/* Breakdown */}
        <div className="stat-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
          <StatBox label="Totalverdi" value={fmtKr(totalVerdi)} color={T.text} />
          <StatBox label="Aksjer" value={fmtKr(totalAksjer)} color={T.green} sub={`Mål: ${fmtKr(målAksjer)}`} />
          <StatBox label="Renter" value={fmtKr(totalRenter)} color={T.teal} sub={`Mål: ${fmtKr(målRenter)}`} />
        </div>

        {/* Visual bar */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ height: 32, borderRadius: 10, overflow: "hidden", display: "flex", background: "rgba(255,255,255,0.04)", position: "relative" }}>
            <div style={{ width: `${aktuellPct}%`, background: `linear-gradient(90deg, ${T.accent}, ${T.green})`, transition: "width 0.3s", display: "flex", alignItems: "center", paddingLeft: 10 }}>
              {aktuellPct > 20 && <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>Aksjer {fmtPct(aktuellPct, 0)}</span>}
            </div>
            <div style={{ flex: 1, background: T.teal, opacity: 0.15, display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 10 }}>
              {(100 - aktuellPct) > 20 && <span style={{ fontSize: 12, fontWeight: 600, color: T.teal }}>Renter {fmtPct(100 - aktuellPct, 0)}</span>}
            </div>
          </div>
          <div style={{ position: "relative", height: 14, marginTop: 2 }}>
            <div style={{ position: "absolute", left: `${targetEq}%`, transform: "translateX(-50%)", fontSize: 10, color: T.orange, fontWeight: 600 }}>▲ Mål {targetEq}%</div>
          </div>
        </div>

        {/* Rebalancing strategies */}
        {needsRebalance && needsLess && (
          <CB label="Hvordan nå målet — skatteoptimalt">
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>

              <StrategyCard
                title="A: Bytt til 80/20 kombifond i ASK"
                result={sA_pct} target={targetEq}
                lines={[
                  `Bytter alt i ASK til DNB Aktiv 80 (80% aksjer, 20% renter)`,
                  `Ingen uttak fra ASK — helt skattefritt`,
                ]}
                tax={0}
              />

              <StrategyCard
                title="B: Ta ut kostpris skattefritt til rentefond"
                result={sB_pct} target={targetEq}
                lines={[
                  `Tar ut ${fmtKr(sB_uttak)} fra ASK (kostpris = skattefritt)`,
                  `Plasserer i rentefond på fondskonto`,
                  `${fmtKr(sB_askEtter)} blir igjen i ASK (100% aksjer)`,
                ]}
                tax={0}
              />

              <StrategyCard
                title="C: Kombiner — 80/20 i ASK + ta ut kostpris"
                result={sC_pct} target={targetEq}
                lines={[
                  `Tar ut ${fmtKr(askKostpris)} skattefritt fra ASK`,
                  `Bytter resten (${fmtKr(askVerdi - askKostpris)}) til DNB Aktiv 80`,
                  `Kostpris-uttaket til rentefond på fondskonto`,
                ]}
                tax={0}
              />

              {sD_uttak > 0 && sD_skatt >= 0 && (
                <StrategyCard
                  title={`D: Optimalt uttak (${sD_fond} i ASK)`}
                  result={sD_pct} target={targetEq}
                  lines={[
                    `Tar ut ${fmtKr(sD_uttak)} fra ASK`,
                    sD_skatt > 0 ? `${fmtKr(Math.min(sD_uttak, askKostpris))} skattefritt + ${fmtKr(Math.max(0, sD_uttak - askKostpris))} skattepliktig` : `Alt innenfor skattefritt beløp`,
                    `Resten (${fmtKr(sD_askEtter)}) i ${sD_fond} i ASK`,
                  ]}
                  tax={sD_skatt}
                />
              )}
            </div>
          </CB>
        )}

        {needsRebalance && !needsLess && (
          <CB label="Hvordan nå målet">
            <div style={{ fontSize: 12.5, color: T.textSec, lineHeight: 1.7 }}>
              Du trenger <strong style={{ color: T.green }}>{fmtKr(Math.abs(måFlytte))} mer i aksjer</strong> for å nå {targetEq}%.
              <div style={{ marginTop: 8, fontSize: 12, color: T.textTer }}>
                → Flytt rentefond til aksjefond på fondskonto, eller sett inn nye midler i ASK.
              </div>
            </div>
          </CB>
        )}

        {!needsRebalance && (
          <CB>
            <div style={{ textAlign: "center", padding: 10, color: T.green, fontSize: 14, fontWeight: 600 }}>
              ✓ Porteføljen er innenfor mål — ingen rebalansering nødvendig
            </div>
          </CB>
        )}
      </div>
    </div>
    <div style={{ marginTop: 18, padding: 14, background: T.surfaceAlt, borderRadius: 12, border: `1px solid ${T.border}` }}>
      <div style={{ fontSize: 11, color: T.textTer, lineHeight: 1.7 }}><strong style={{ color: T.textSec }}>ASK-regler:</strong> Kun aksjefond og kombifond med min. 80% aksjeandel i ASK. Bytte mellom fond i ASK er skattefritt. Ved uttak: kostpris kan tas ut skattefritt, gevinst beskattes med {fmtPct(EFF_SKATT * 100)} eff. sats. Rentefond må ligge på fondskonto.</div>
    </div>
  </div>);
}

function StrategyCard({ title, result, target, lines, tax }) {
  const diff = Math.abs(result - target);
  const isMatch = diff < 3;
  return (
    <div style={{ padding: "12px 14px", background: isMatch ? "rgba(48,209,88,0.04)" : "transparent", borderRadius: 11, border: `1px solid ${isMatch ? "rgba(48,209,88,0.15)" : T.border}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: isMatch ? T.green : T.text }}>{title}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: isMatch ? T.green : T.orange }}>{fmtPct(result, 0)}</span>
          {isMatch && <span style={{ fontSize: 10, color: T.green, fontWeight: 600 }}>✓</span>}
        </div>
      </div>
      {lines.map((l, i) => <div key={i} style={{ fontSize: 12, color: T.textSec, lineHeight: 1.6, paddingLeft: 8 }}>• {l}</div>)}
      <div style={{ marginTop: 6, fontSize: 11, color: T.textTer }}>
        Skatt: {tax > 0 ? <span style={{ color: T.red }}>{fmtKr(tax)}</span> : <span style={{ color: T.green }}>Ingen</span>}
        {" · "}Avvik fra mål: {fmtPct(diff)}
      </div>
    </div>
  );
}


// ══════════════════════════════════════

// ══════════════════════════════════════
// TOOL 8: Pensjonsgap

// ══════════════════════════════════════
// TOOL: Pensjonsgap
// ══════════════════════════════════════
function PensjonGap() {
  const [alder, setAlder] = useState(35);
  const [kjonn, setKjonn] = useState("mann");
  const [inntekt, setInntekt] = useState(800000);
  const [onsketPct, setOnsketPct] = useState(66);
  const [pensjonsalder, setPensjonsalder] = useState(67);
  const [tpSatsLav, setTpSatsLav] = useState(5);
  const [tpSatsHoy, setTpSatsHoy] = useState(15);
  const [tpSaldo, setTpSaldo] = useState(500000);
  const [eigenSparing, setEigenSparing] = useState(500000);
  const [mndSparing, setMndSparing] = useState(3000);
  const [forventetAvk, setForventetAvk] = useState(6);
  const [inflasjon, setInflasjon] = useState(2.5);

  const G = 124028;
  const levealder = { mann: 83, kvinne: 86 };
  const forventetLevealder = levealder[kjonn];
  const arTilPensjon = Math.max(0, pensjonsalder - alder);
  const realAvk = ((1 + forventetAvk / 100) / (1 + inflasjon / 100) - 1);

  // TP brackets
  const grense71G = 7.1 * G;
  const grense12G = 12 * G;
  const tpInntektLav = Math.min(inntekt, grense71G);
  const tpInntektHoy = Math.max(0, Math.min(inntekt, grense12G) - grense71G);
  const arligTpInnskudd = tpInntektLav * (tpSatsLav / 100) + tpInntektHoy * (tpSatsHoy / 100);

  // FV of TP in REAL terms (inflation-adjusted)
  let tpSluttverdi = tpSaldo;
  for (let y = 0; y < arTilPensjon; y++) { tpSluttverdi = tpSluttverdi * (1 + realAvk) + arligTpInnskudd; }
  const tpUtbetalingsaar = Math.max(10, 77 - pensjonsalder);
  const tpArlig = tpSluttverdi / tpUtbetalingsaar;
  const tpMnd = tpArlig / 12;

  // Folketrygd (values are already in today's kroner since G adjusts with wages)
  const pensjonsgivende = Math.min(inntekt, grense71G);
  const arligOpptjening = pensjonsgivende * 0.181;
  const arbeidsaar = Math.max(0, pensjonsalder - 25);
  const totalPensBeholdning = arligOpptjening * arbeidsaar;
  const delingstall = pensjonsalder <= 62 ? 21 : pensjonsalder <= 67 ? 17.5 : pensjonsalder <= 70 ? 15.5 : 14;
  const folketrygdArlig = totalPensBeholdning / delingstall;
  const folketrygdMnd = folketrygdArlig / 12;

  // Egen sparing in REAL terms
  let eigenSluttverdi = eigenSparing;
  for (let y = 0; y < arTilPensjon; y++) { eigenSluttverdi = eigenSluttverdi * (1 + realAvk) + mndSparing * 12; }
  const eigenUtbetalingsaar = Math.max(10, forventetLevealder - pensjonsalder);
  const eigenArlig = eigenSluttverdi / eigenUtbetalingsaar;
  const eigenMnd = eigenArlig / 12;

  const onsketPensjon = inntekt * (onsketPct / 100);
  const onsketMnd = onsketPensjon / 12;
  const totalMnd = folketrygdMnd + tpMnd + eigenMnd;
  const totalArlig = totalMnd * 12;
  const gap = onsketPensjon - totalArlig;
  const gapMnd = gap / 12;
  const dekningsgrad = onsketPensjon > 0 ? (totalArlig / onsketPensjon) * 100 : 0;

  let ekstraMndSparing = 0;
  if (gap > 0 && arTilPensjon > 0) {
    const behov = gap * eigenUtbetalingsaar;
    const r = realAvk / 12;
    const n = arTilPensjon * 12;
    ekstraMndSparing = r > 0 ? behov * r / (Math.pow(1 + r, n) - 1) : behov / n;
  }

  // Timeline in real terms
  const pensjonAar = forventetLevealder - pensjonsalder;
  const timeline = [];
  for (let y = 0; y <= pensjonAar; y++) {
    const ft = folketrygdArlig;
    const tp = y < tpUtbetalingsaar ? tpArlig : 0;
    const eg = y < eigenUtbetalingsaar ? eigenArlig : 0;
    timeline.push(ft + tp + eg);
  }

  const sources = [
    { name: "Folketrygd", value: folketrygdMnd, color: T.accent },
    { name: "Tjenestepensjon", value: tpMnd, color: T.green },
    { name: "Egen sparing", value: eigenMnd, color: T.teal },
  ];
  const barMax = Math.max(onsketMnd, totalMnd);

  return (<div>
    <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1.15fr", gap: 28 }}>
      <div><SL>Din situasjon</SL>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 13, color: T.textSec, marginBottom: 6 }}>Forventet levealder</div>
          <div style={{ display: "flex", gap: 4 }}>
            {Object.entries(levealder).map(([k, v]) => (
              <button key={k} onClick={() => setKjonn(k)} style={{ flex: 1, padding: "9px", border: `1px solid ${kjonn === k ? T.accent : T.border}`, borderRadius: 9, background: kjonn === k ? T.accentGlow : "transparent", color: kjonn === k ? T.accent : T.textSec, cursor: "pointer", fontSize: 12, fontWeight: 600, textTransform: "capitalize" }}>
                {k === "mann" ? "Mann" : "Kvinne"} — {v} år
              </button>))}
          </div>
        </div>
        <Slider label="Alder" value={alder} onChange={setAlder} min={20} max={65} suffix=" år" decimals={0} />
        <Slider label="Årsinntekt (brutto)" value={inntekt} onChange={setInntekt} min={200000} max={3000000} step={25000} format={v => fmtKr(v)} />
        <Slider label="Ønsket pensjonsnivå" value={onsketPct} onChange={setOnsketPct} min={30} max={100} suffix=" % av lønn" decimals={0} />
        <Slider label="Pensjonsalder" value={pensjonsalder} onChange={setPensjonsalder} min={62} max={75} suffix=" år" decimals={0} />

        <div style={{ padding: 14, background: T.surfaceAlt, borderRadius: 12, border: `1px solid ${T.border}`, marginTop: 8, marginBottom: 10 }}>
          <div style={{ fontSize: 11, color: T.green, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 10 }}>Tjenestepensjon (innskudd)</div>
          <Slider label={`Sparesats opp til 7,1G`} value={tpSatsLav} onChange={setTpSatsLav} min={0} max={7} step={0.5} suffix=" %" />
          <Slider label={`Sparesats 7,1G – 12G`} value={tpSatsHoy} onChange={setTpSatsHoy} min={0} max={25} step={0.5} suffix=" %" />
          <Slider label="Nåværende saldo" value={tpSaldo} onChange={setTpSaldo} min={0} max={5000000} step={50000} format={v => fmtKr(v)} />
          <div style={{ fontSize: 11, color: T.textTer }}>Årlig innskudd: {fmtKr(arligTpInnskudd)} · Utbetaling: {tpUtbetalingsaar} år</div>
        </div>

        <div style={{ padding: 14, background: T.surfaceAlt, borderRadius: 12, border: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 11, color: T.teal, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 10 }}>Egen sparing</div>
          <Slider label="Nåværende sparing" value={eigenSparing} onChange={setEigenSparing} min={0} max={10000000} step={50000} format={v => fmtKr(v)} />
          <Slider label="Månedlig sparing" value={mndSparing} onChange={setMndSparing} min={0} max={30000} step={500} format={v => fmtKr(v)} />
          <Slider label="Forventet avkastning" value={forventetAvk} onChange={setForventetAvk} min={2} max={10} step={0.25} suffix=" %" />
          <Slider label="Inflasjon" value={inflasjon} onChange={setInflasjon} min={0} max={6} step={0.25} suffix=" %" />
        </div>
      </div>

      <div><SL>Pensjonsprognose <span style={{ fontSize: 12, fontWeight: 400, color: T.teal }}>(i dagens kroner)</span></SL>
        <div style={{ background: gap <= 0 ? T.greenGlow : T.redGlow, border: `1px solid ${gap <= 0 ? "rgba(52,211,153,0.15)" : "rgba(248,113,113,0.15)"}`, borderRadius: 16, padding: 20, marginBottom: 16, textAlign: "center" }}>
          <div style={{ fontSize: 13, color: T.textSec }}>Dekningsgrad</div>
          <div style={{ fontSize: 48, fontWeight: 800, color: gap <= 0 ? T.green : dekningsgrad >= 80 ? T.orange : T.red, lineHeight: 1.1, marginTop: 4 }}>{fmtPct(dekningsgrad, 0)}</div>
          <div style={{ fontSize: 14, color: T.textSec, marginTop: 6 }}>
            {gap <= 0 ? "✓ Du er i mål!" : `Gap: ${fmtKr(Math.abs(gapMnd))}/mnd — trenger ${fmtKr(ekstraMndSparing)}/mnd ekstra`}
          </div>
        </div>

        <div className="stat-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
          <StatBox label="Ønsket" value={`${fmtKr(onsketMnd)}/mnd`} color={T.text} sub={`${onsketPct}% av lønn`} />
          <StatBox label="Forventet" value={`${fmtKr(totalMnd)}/mnd`} color={gap <= 0 ? T.green : T.orange} sub="I dagens kroner" />
          <StatBox label={gap > 0 ? "Gap" : "Overskudd"} value={`${fmtKr(Math.abs(gapMnd))}/mnd`} color={gap > 0 ? T.red : T.green} />
        </div>

        <CB label="Sammensetning" style={{ marginBottom: 14 }}>
          <div style={{ height: 28, borderRadius: 8, overflow: "hidden", display: "flex", background: "rgba(255,255,255,0.04)", marginBottom: 8 }}>
            {sources.filter(s => s.value > 0).map(s => (
              <div key={s.name} style={{ width: `${barMax > 0 ? (s.value / barMax) * 100 : 0}%`, background: s.color, display: "flex", alignItems: "center", justifyContent: "center", transition: "width 0.3s" }}>
                {s.value / barMax > 0.12 && <span style={{ fontSize: 10, fontWeight: 600, color: "#fff", whiteSpace: "nowrap" }}>{fmtKr(s.value)}</span>}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {sources.map(s => (<div key={s.name} style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 8, height: 8, borderRadius: 3, background: s.color }} /><span style={{ fontSize: 11, color: T.textSec }}>{s.name}: {fmtKr(s.value)}/mnd</span></div>))}
          </div>
        </CB>

        <CB label={`Pensjonsinntekt ${pensjonsalder}–${forventetLevealder} år (dagens kroner)`} style={{ marginBottom: 14 }}>
          <IChart data={timeline.map(t => t / 12)} color={T.green} yFormat={v => `${fmtKr(v)}/mnd`} xFormat={i => `${pensjonsalder + i}`} height={120} />
          <div style={{ fontSize: 11, color: T.textTer, marginTop: 6 }}>TP stopper ved {pensjonsalder + tpUtbetalingsaar} år. Folketrygd er livsvarig.</div>
        </CB>

        <CB label="Detaljer (dagens kroner)">
          {[
            { name: "Folketrygd", value: folketrygdMnd, color: T.accent, sub: `${arbeidsaar} år opptjening · Livsvarig`, period: "livsvarig" },
            { name: "Tjenestepensjon", value: tpMnd, color: T.green, sub: `Saldo ved ${pensjonsalder}: ${fmtKr(tpSluttverdi)} · ${tpUtbetalingsaar} år`, period: `${tpUtbetalingsaar} år` },
            { name: "Egen sparing", value: eigenMnd, color: T.teal, sub: `Verdi ved ${pensjonsalder}: ${fmtKr(eigenSluttverdi)} · ${eigenUtbetalingsaar} år`, period: `${eigenUtbetalingsaar} år` },
          ].map(s => (
            <div key={s.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${T.border}` }}>
              <div><div style={{ fontSize: 12, color: T.textSec }}>{s.name}</div><div style={{ fontSize: 10.5, color: T.textTer }}>{s.sub}</div></div>
              <span style={{ fontSize: 14, fontWeight: 700, color: s.color }}>{fmtKr(s.value)}/mnd</span>
            </div>
          ))}
        </CB>

        {gap > 0 && (
          <div style={{ marginTop: 14, padding: 16, background: "rgba(248,113,113,0.04)", borderRadius: 14, border: "1px solid rgba(248,113,113,0.1)" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 6 }}>Slik lukker du gapet</div>
            <div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.7 }}>
              Spar <strong style={{ color: T.orange }}>{fmtKr(ekstraMndSparing)}/mnd</strong> ekstra i {arTilPensjon} år. Realavkastning: {fmtPct(realAvk * 100)} ({fmtPct(forventetAvk)} nom. − {fmtPct(inflasjon)} infl.). Alternativ: utsett pensjonsalder.
            </div>
          </div>
        )}
      </div>
    </div>
    <div style={{ marginTop: 18, padding: 14, background: T.surfaceAlt, borderRadius: 12, border: `1px solid ${T.border}` }}>
      <div style={{ fontSize: 11, color: T.textTer, lineHeight: 1.7 }}><strong style={{ color: T.textSec }}>Alle beløp i dagens kroner</strong> (realverdijustert med {fmtPct(inflasjon)} inflasjon). Folketrygd: 18,1% opptjening opp til 7,1G. TP: innskuddsordning, x% til 7,1G + y% fra 7,1G til 12G, min 10 år / til 77 år. Sjekk <strong>norskpensjon.no</strong> for presise tall.</div>
    </div>
  </div>);
}

// TOOL 10: Inflasjon & 72-regelen
// ══════════════════════════════════════
function TidOgPenger() {
  const [belop, setBelop] = useState(1000000);
  const [ar, setAr] = useState(20);
  const [inflasjon, setInflasjon] = useState(2.5);
  const [avkastning, setAvkastning] = useState(7);

  const realverdi = belop / Math.pow(1 + inflasjon / 100, ar);
  const fremtidigKostnad = belop * Math.pow(1 + inflasjon / 100, ar);
  const kjopekraftTap = ((belop - realverdi) / belop) * 100;

  // 72-regelen
  const doblingstidAvk = avkastning > 0 ? 72 / avkastning : Infinity;
  const doblingstidInfl = inflasjon > 0 ? 72 / inflasjon : Infinity;
  const antallDoblinger = avkastning > 0 ? ar / doblingstidAvk : 0;
  const verdiFremtid = belop * Math.pow(2, antallDoblinger);

  // Timeline data
  const realData = [], nomData = [], inflData = [];
  for (let y = 0; y <= ar; y++) {
    realData.push(belop / Math.pow(1 + inflasjon / 100, y));
    nomData.push(belop * Math.pow(1 + avkastning / 100, y));
    inflData.push(belop * Math.pow(1 + inflasjon / 100, y));
  }

  return (<div>
    <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1.15fr", gap: 28 }}>
      <div><SL>Parametere</SL>
        <Slider label="Beløp" value={belop} onChange={setBelop} min={100000} max={20000000} step={50000} format={v => fmtKr(v)} />
        <Slider label="Tidshorisont" value={ar} onChange={setAr} min={1} max={50} suffix=" år" decimals={0} />
        <Slider label="Inflasjon" value={inflasjon} onChange={setInflasjon} min={0} max={10} step={0.25} suffix=" %" />
        <Slider label="Avkastning" value={avkastning} onChange={setAvkastning} min={0} max={15} step={0.25} suffix=" %" />
      </div>

      <div>
        <SL>Tid og penger</SL>

        {/* Inflation impact */}
        <div style={{ background: T.orangeGlow, border: "1px solid rgba(255,159,10,0.15)", borderRadius: 16, padding: 18, marginBottom: 16, textAlign: "center" }}>
          <div style={{ fontSize: 13, color: T.textSec }}>Kjøpekraften til {fmtKr(belop)} om {ar} år</div>
          <div style={{ fontSize: 40, fontWeight: 800, color: T.orange, lineHeight: 1.1, marginTop: 4 }}>{fmtKr(realverdi)}</div>
          <div style={{ fontSize: 13, color: T.textSec, marginTop: 6 }}>Du mister {fmtPct(kjopekraftTap, 0)} av kjøpekraften med {fmtPct(inflasjon)} inflasjon</div>
        </div>

        <div className="stat-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
          <StatBox label="72-regelen: dobling" value={`${fmt(doblingstidAvk, 1)} år`} color={T.green} sub={`ved ${fmtPct(avkastning)} avkastning`} />
          <StatBox label="72-regelen: halvering" value={`${fmt(doblingstidInfl, 1)} år`} color={T.red} sub={`kjøpekraft ved ${fmtPct(inflasjon)} inflasjon`} />
          <StatBox label={`${fmtKr(belop)} om ${ar} år`} value={fmtKr(fremtidigKostnad)} color={T.orange} sub={`med ${fmtPct(inflasjon)} inflasjon`} />
          <StatBox label={`Investert: ${fmtKr(belop)}`} value={fmtKr(verdiFremtid)} color={T.green} sub={`med ${fmtPct(avkastning)} avkastning`} />
        </div>

        <CB label="Kjøpekraft vs. investert over tid" style={{ marginBottom: 14 }}>
          <MultiLineChart datasets={[
            { data: nomData, color: T.green, label: `Investert (${fmtPct(avkastning)})` },
            { data: inflData, color: T.orange, label: `Fremtidig kostnad (${fmtPct(inflasjon)})`, dashed: true },
            { data: realData, color: T.red, label: "Kjøpekraft (nominelt)", dashed: true },
          ]} labels height={110} />
        </CB>

        <div style={{ padding: 14, background: T.surfaceAlt, borderRadius: 12, border: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.8 }}>
            <strong style={{ color: T.text }}>72-regelen:</strong> Del 72 på renten for å finne antall år til dobling. Ved {fmtPct(avkastning)} tar det {fmt(doblingstidAvk, 1)} år å doble pengene. Men ved {fmtPct(inflasjon)} inflasjon halveres kjøpekraften på {fmt(doblingstidInfl, 1)} år. Over {ar} år dobles pengene {fmt(antallDoblinger, 1)} ganger — fra {fmtKr(belop)} til {fmtKr(verdiFremtid)}.
          </div>
        </div>
      </div>
    </div>
  </div>);
}

// ══════════════════════════════════════
// TOOL: Lønn vs Utbytte
// ══════════════════════════════════════
function LonnVsUtbytte() {
  const [overskudd, setOverskudd] = useState(1500000);
  const [annenLonn, setAnnenLonn] = useState(0);
  const [aksjekapital, setAksjekapital] = useState(30000);
  const [agaSone, setAgaSone] = useState(14.1);

  // 2026 tax rates
  const SELSKAPSSKATT = 0.22;
  const TRYGD_LONN = 0.076; // 2026
  const MINSTEFRADRAG_SATS = 0.46;
  const MINSTEFRADRAG_MAX = 110850;
  const PERSONFRADRAG = 118300; // 2026 est. (justert med 4% lønnsvekst)
  const TRINNSKATT = [
    { fra: 0, til: 226100, sats: 0 },
    { fra: 226100, til: 318300, sats: 0.017 },
    { fra: 318300, til: 725050, sats: 0.04 },
    { fra: 725050, til: 980100, sats: 0.137 },
    { fra: 980100, til: 1467200, sats: 0.167 },
    { fra: 1467200, til: Infinity, sats: 0.177 },
  ];
  const ALM_SKATT = 0.22;
  const FERIEPENGER_SATS = 0.12;

  const calcTrinnskatt = (personinntekt) => {
    let skatt = 0;
    for (const trinn of TRINNSKATT) {
      if (personinntekt > trinn.fra) {
        skatt += (Math.min(personinntekt, trinn.til) - trinn.fra) * trinn.sats;
      }
    }
    return skatt;
  };

  const calcLonnSkatt = (lonn) => {
    const totalPersoninntekt = lonn + annenLonn;
    const basePersoninntekt = annenLonn;

    // Trygdeavgift (kun på marginal)
    const trygd = lonn * TRYGD_LONN;

    // Trinnskatt (marginal)
    const trinnTotal = calcTrinnskatt(totalPersoninntekt);
    const trinnBase = calcTrinnskatt(basePersoninntekt);
    const trinnMarginal = trinnTotal - trinnBase;

    // Alminnelig inntekt: lønn - minstefradrag - personfradrag
    const minstefradrag = Math.min(lonn * MINSTEFRADRAG_SATS, MINSTEFRADRAG_MAX);
    const almInntekt = Math.max(0, lonn - minstefradrag - PERSONFRADRAG);
    const almSkatt = almInntekt * ALM_SKATT;

    return { trygd, trinnskatt: trinnMarginal, almSkatt, total: trygd + trinnMarginal + almSkatt, minstefradrag };
  };

  // Beregn for ulike lønnsnivåer
  const calcScenario = (lonn) => {
    // Selskapets kostnad for lønn
    const feriepenger = lonn * FERIEPENGER_SATS;
    const aga = (lonn + feriepenger) * (agaSone / 100);
    const totalLonnskostnad = lonn + feriepenger + aga;

    // Overskudd igjen til utbytte
    const overskuddEtterLonn = Math.max(0, overskudd - totalLonnskostnad);
    const selskapsskatt = overskuddEtterLonn * SELSKAPSSKATT;
    const tilUtbytte = overskuddEtterLonn - selskapsskatt;

    // Skjermingsfradrag på utbytte
    const skjerming = aksjekapital * SKJERMINGSRENTE;
    const skattbartUtbytte = Math.max(0, tilUtbytte - skjerming);
    const utbytteSkatt = skattbartUtbytte * EFF_SKATT;
    const nettoUtbytte = tilUtbytte - utbytteSkatt;

    // Personlig skatt på lønn
    const lonnSkatt = calcLonnSkatt(lonn);

    // Netto til eier
    const nettoLonn = lonn - lonnSkatt.total;
    const nettoTotal = nettoLonn + nettoUtbytte;

    // Samlet skatt (selskap + personlig)
    const samletSkatt = selskapsskatt + utbytteSkatt + lonnSkatt.total + aga;

    // Pensjonsopptjening (18.1% av lønn opp til 7.1G)
    const G = 124028;
    const pensjonsGrunnlag = Math.min(lonn, 7.1 * G);
    const pensjonsOpptjening = pensjonsGrunnlag * 0.181;

    return { lonn, feriepenger, aga, totalLonnskostnad, overskuddEtterLonn, selskapsskatt, tilUtbytte, skjerming, utbytteSkatt, nettoUtbytte, lonnSkatt, nettoLonn, nettoTotal, samletSkatt, pensjonsOpptjening, effSkattPct: overskudd > 0 ? (samletSkatt / overskudd) * 100 : 0 };
  };

  // Find optimal: test every 10k from 0 to overskudd
  const scenarios = [];
  const step = 25000;
  for (let l = 0; l <= overskudd; l += step) {
    scenarios.push(calcScenario(l));
  }

  const optimal = scenarios.reduce((best, s) => s.nettoTotal > best.nettoTotal ? s : best, scenarios[0]);
  const altLonn = calcScenario(0);
  const altUtbytte = calcScenario(Math.min(overskudd, overskudd / (1 + FERIEPENGER_SATS + agaSone / 100)));
  const alt71G = calcScenario(Math.min(7.1 * 124028, overskudd / (1 + FERIEPENGER_SATS + agaSone / 100)));

  // Chart data: netto vs lønnsnivå
  const chartData = scenarios.map(s => s.nettoTotal);

  return (<div>
    <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1.15fr", gap: 28 }}>
      <div><SL>Selskapet</SL>
        <Slider label="Overskudd før eiers lønn" value={overskudd} onChange={setOverskudd} min={200000} max={5000000} step={25000} format={v => fmtKr(v)} />
        <Slider label="Annen lønnsinntekt" value={annenLonn} onChange={setAnnenLonn} min={0} max={2000000} step={25000} format={v => fmtKr(v)} />
        <Slider label="Aksjekapital (skjermingsgrunnlag)" value={aksjekapital} onChange={setAksjekapital} min={30000} max={5000000} step={10000} format={v => fmtKr(v)} />
        <Slider label="Arbeidsgiveravgift" value={agaSone} onChange={setAgaSone} min={0} max={14.1} step={0.1} suffix=" %" />

        <div style={{ marginTop: 12, padding: 14, background: T.surfaceAlt, borderRadius: 12, border: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Skattesatser 2026</div>
          <div style={{ fontSize: 11, color: T.textTer, lineHeight: 1.7 }}>
            Selskapsskatt: 22% · Utbytteskatt: 37,84% (etter oppjust. 1,72) · Trygdeavgift lønn: 7,6% · Trinnskatt: 0–17,7% · Feriepenger: 12%
          </div>
        </div>
      </div>

      <div><SL>Optimal fordeling</SL>
        <div style={{ background: T.greenGlow, border: "1px solid rgba(52,211,153,0.15)", borderRadius: 16, padding: 20, marginBottom: 16, textAlign: "center" }}>
          <div style={{ fontSize: 13, color: T.textSec }}>Høyest netto til deg</div>
          <div style={{ fontSize: 42, fontWeight: 800, color: T.green, lineHeight: 1.1, marginTop: 4 }}>{fmtKr(optimal.nettoTotal)}</div>
          <div style={{ fontSize: 13, color: T.textSec, marginTop: 6 }}>Lønn: {fmtKr(optimal.lonn)} · Utbytte: {fmtKr(optimal.tilUtbytte)}</div>
          <div style={{ fontSize: 12, color: T.textTer, marginTop: 4 }}>Eff. samlet skatt: {fmtPct(optimal.effSkattPct)}</div>
        </div>

        <div className="stat-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
          <StatBox label="Netto lønn" value={fmtKr(optimal.nettoLonn)} color={T.accent} sub={`Brutto: ${fmtKr(optimal.lonn)}`} />
          <StatBox label="Netto utbytte" value={fmtKr(optimal.nettoUtbytte)} color={T.green} sub={`Brutto: ${fmtKr(optimal.tilUtbytte)}`} />
          <StatBox label="Pensjonsopptjening" value={fmtKr(optimal.pensjonsOpptjening)} color={T.teal} sub="18,1% av lønn opp til 7,1G" />
          <StatBox label="Skjerming utbytte" value={fmtKr(optimal.skjerming)} color={T.purple} sub={`${fmtPct(SKJERMINGSRENTE * 100)} × ${fmtKr(aksjekapital)}`} />
        </div>

        {/* Comparison table */}
        <CB label="Sammenligning" style={{ marginBottom: 14 }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead><tr style={{ borderBottom: `1px solid ${T.border}` }}>
                <th style={{ ...thS, textAlign: "left" }}>Strategi</th>
                <th style={thS}>Netto</th>
                <th style={thS}>Eff. skatt</th>
                <th style={thS}>Pensjon</th>
              </tr></thead>
              <tbody>
                {[
                  { name: "★ Optimal", ...optimal, highlight: true },
                  { name: "Kun utbytte", ...altLonn },
                  { name: `Lønn opp til 7,1G`, ...alt71G },
                  { name: "Maks lønn", ...altUtbytte },
                ].map((s, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: s.highlight ? "rgba(52,211,153,0.04)" : "transparent" }}>
                    <td style={{ padding: "8px 10px", fontSize: 12, color: s.highlight ? T.green : T.textSec, fontWeight: s.highlight ? 600 : 400 }}>{s.name}</td>
                    <Td color={s.highlight ? T.green : T.text} bold={s.highlight}>{fmtKr(s.nettoTotal)}</Td>
                    <Td>{fmtPct(s.effSkattPct)}</Td>
                    <Td color={T.teal}>{fmtKr(s.pensjonsOpptjening)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CB>

        <CB label="Netto til eier vs. lønnsnivå">
          <IChart data={chartData} color={T.green} yFormat={v => fmtKr(v)} xFormat={i => fmtKr(i * step)} height={110} />
        </CB>
      </div>
    </div>
    <div style={{ marginTop: 18, padding: 14, background: T.surfaceAlt, borderRadius: 12, border: `1px solid ${T.border}` }}>
      <div style={{ fontSize: 11, color: T.textTer, lineHeight: 1.7 }}><strong style={{ color: T.textSec }}>Beregning:</strong> Selskapet betaler lønn + feriepenger (12%) + arbeidsgiveravgift. Overskudd etter lønn beskattes med 22% selskapsskatt, deretter utbytte med 37,84% eff. sats (etter skjermingsfradrag). Lønnsbeskatning inkl. trygdeavgift (7,6%), trinnskatt og skatt på alminnelig inntekt (22%). Minstefradrag og personfradrag er hensyntatt. Pensjonsopptjening kun på lønn opp til 7,1G. <strong>NB:</strong> Forenklet beregning — snakk med regnskapsfører for eksakt optimalisering.</div>
    </div>
  </div>);
}

// ══ Main ══
const toolGroups = [
  { label: "Sparing", tools: [
    { id: "compound", label: "Rentes rente", icon: "📈" },
    { id: "feeimpact", label: "Kostnadseffekt", icon: "💸" },
    { id: "tidpenger", label: "Tid & penger", icon: "⏳" },
  ]},
  { label: "Planlegging", tools: [
    { id: "wealth", label: "Wealth Planner", icon: "🏦" },
    { id: "pension", label: "Pensjonsgap", icon: "👴" },
    { id: "fire", label: "FIRE", icon: "🔥" },
  ]},
  { label: "Verktøy", tools: [
    { id: "rebalance", label: "Rebalansering", icon: "🔄" },
    { id: "lonnUtbytte", label: "Lønn vs Utbytte", icon: "💼" },
    { id: "loan", label: "Lånekalkulator", icon: "🏠" },
  ]},
];

const allTools = toolGroups.flatMap(g => g.tools);

export default function App() {
  const [active, setActive] = useState("compound");
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const render = () => { switch (active) { case "compound": return <CompoundCalc />; case "wealth": return <WealthPlanner />; case "feeimpact": return <FeeImpact />; case "pension": return <PensjonGap />; case "rebalance": return <Rebalancer />; case "tidpenger": return <TidOgPenger />; case "fire": return <FIRE />; case "lonnUtbytte": return <LonnVsUtbytte />; case "loan": return <Loan />; default: return null; } };

  return (<div style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: "'SF Pro Display',-apple-system,'Helvetica Neue',sans-serif", opacity: mounted ? 1 : 0, transition: "opacity 0.5s ease" }}>
    <style>{MOBILE_CSS}</style>

    {/* Header */}
    <div className="main-padding" style={{ padding: "32px 40px 0", maxWidth: 1120, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em", color: T.text, margin: 0 }}>Finansverktøy</h1>
          <p style={{ fontSize: 13, color: T.textTer, margin: "4px 0 0", letterSpacing: "0.01em" }}>Kalkulatorer med norske skatteregler</p>
        </div>
      </div>
    </div>

    {/* Navigation — grouped */}
    <div className="content-padding" style={{ maxWidth: 1120, margin: "0 auto", padding: "0 40px" }}>
      <div style={{ display: "flex", gap: 20, marginBottom: 28, flexWrap: "wrap" }}>
        {toolGroups.map(group => (
          <div key={group.label} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ fontSize: 10, color: T.textTer, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, paddingLeft: 4, marginBottom: 2 }}>{group.label}</div>
            <div style={{ display: "flex", gap: 3 }}>
              {group.tools.map(t => {
                const isActive = active === t.id;
                return (
                  <button key={t.id} onClick={() => setActive(t.id)} style={{
                    padding: "7px 14px", border: "none", borderRadius: 10, cursor: "pointer",
                    fontSize: 12.5, fontWeight: isActive ? 600 : 450, whiteSpace: "nowrap",
                    transition: "all 0.2s ease",
                    background: isActive ? "rgba(77,163,255,0.12)" : T.surfaceAlt,
                    color: isActive ? T.accent : T.textSec,
                    boxShadow: isActive ? "0 0 0 1px rgba(77,163,255,0.25)" : "0 0 0 1px transparent",
                  }}>
                    <span style={{ marginRight: 4 }}>{t.icon}</span>{t.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Content */}
    <div className="bottom-padding" style={{ maxWidth: 1120, margin: "0 auto", padding: "0 40px 50px" }}>
      <Card className="card-padding" glow={T.accentGlow}>{render()}</Card>
      <div style={{ marginTop: 24, textAlign: "center", fontSize: 11, color: T.textTer }}>
        Verktøyene er ment som veiledning og erstatter ikke profesjonell rådgivning. Skatteregler er forenklet.
      </div>
    </div>
  </div>);
}
