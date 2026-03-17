import { useState, useEffect, useRef, useMemo, useCallback } from "react";

const MOBILE_CSS = `
  @media (max-width: 768px) {
    .responsive-grid { grid-template-columns: 1fr !important; }
    .stat-grid-2 { grid-template-columns: 1fr 1fr !important; }
    .main-padding { padding: 16px 16px 0 !important; }
    .content-padding { padding: 0 16px !important; }
    .bottom-padding { padding: 0 16px 30px !important; }
    .card-padding { padding: 18px !important; }
    .tab-bar { gap: 2px !important; }
    .tab-bar button { padding: 8px 10px !important; font-size: 12px !important; }
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
const FORMUE_S1 = 0.01, FORMUE_S2 = 0.011, FORMUE_BUNN = 1700000, VERDI_RABATT = 0.20, SKJERMINGSRENTE = 0.032;

const T = { bg: "#08090a", surface: "#111214", surfaceAlt: "rgba(255,255,255,0.025)", border: "rgba(255,255,255,0.06)", borderLight: "rgba(255,255,255,0.1)", text: "#f5f5f7", textSec: "rgba(255,255,255,0.55)", textTer: "rgba(255,255,255,0.32)", accent: "#2997ff", accentGlow: "rgba(41,151,255,0.12)", green: "#30d158", greenGlow: "rgba(48,209,88,0.12)", orange: "#ff9f0a", orangeGlow: "rgba(255,159,10,0.12)", red: "#ff453a", redGlow: "rgba(255,69,58,0.12)", purple: "#bf5af2", teal: "#64d2ff", yellow: "#ffd60a", pink: "#ff375f" };

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
  const [showMC, setShowMC] = useState(true);
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

  const result = useMemo(() => {
    const maxY = 60;
    const calcWT = (bal) => {
      if (!wTax || bal <= 0) return 0;
      const tv = bal * (1 - VERDI_RABATT * (prof.ak / 100));
      const above = Math.max(0, tv - FORMUE_BUNN);
      return Math.min(above, 20000000 - FORMUE_BUNN) * FORMUE_S1 + Math.max(0, above - (20000000 - FORMUE_BUNN)) * FORMUE_S2;
    };

    let bal = port, cb = costBasis, exp = expense, cumSkj = 0, totTax = 0, totWT = 0;
    const data = [bal]; let depYear = null;
    for (let y = 1; y <= maxY; y++) {
      cumSkj += cb * SKJERMINGSRENTE;
      const wt = calcWT(bal); totWT += wt;
      bal *= (1 + expRet / 100);
      const gp = bal > cb && bal > 0 ? (bal - cb) / bal : 0;
      const wg = exp * gp;
      let wtx = 0;
      if (isASK) { const su = Math.min(cumSkj, wg); wtx = Math.max(0, wg - su) * EFF_SKATT; cumSkj = Math.max(0, cumSkj - su); }
      else { wtx = wg * EFF_SKATT; }
      totTax += wtx;
      cb = Math.max(0, cb - exp * (1 - gp));
      bal -= (exp + wt + wtx);
      exp *= (1 + infl / 100);
      if (bal <= 0 && !depYear) { depYear = y; bal = 0; }
      data.push(Math.max(0, bal));
    }

    const pData = { p10: [], p25: [], p50: [], p75: [], p90: [] };
    let survRate = null;
    if (showMC) {
      const N = 500, mu = expRet / 100;
      const allB = Array.from({ length: maxY + 1 }, () => []);
      const ends = [];
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
          const wtx = Math.max(0, wg - su) * EFF_SKATT;
          if (isASK) scum = Math.max(0, scum - su);
          scb = Math.max(0, scb - se * (1 - gp));
          sb = Math.max(0, sb - se - swt - wtx);
          se *= (1 + infl / 100);
          allB[y].push(sb);
        }
        ends.push(sb);
      }
      for (let y = 0; y <= maxY; y++) { const sorted = allB[y].filter(v => isFinite(v)).sort((a, b) => a - b); if (sorted.length === 0) { pData.p10.push(0); pData.p25.push(0); pData.p50.push(0); pData.p75.push(0); pData.p90.push(0); continue; } const p = v => sorted[Math.min(Math.floor(v * sorted.length), sorted.length - 1)]; pData.p10.push(p(0.1)); pData.p25.push(p(0.25)); pData.p50.push(p(0.5)); pData.p75.push(p(0.75)); pData.p90.push(p(0.9)); }
      survRate = ends.filter(v => v > 0).length / N * 100;
    }
    return { data, depYear, pData, survivalRate: survRate, maxY, totTax, totWT, cumSkj };
  }, [port, costBasis, expense, expRet, infl, wTax, riskP, showMC, isASK, volPct]);

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
          <Toggle label="Monte Carlo (500 sim.)" value={showMC} onChange={setShowMC} />
        </div>
      </div>
      <div><SL>Prognose</SL>
        <div style={{ background: result.depYear ? T.redGlow : T.greenGlow, border: `1px solid ${result.depYear ? "rgba(255,69,58,0.15)" : "rgba(48,209,88,0.15)"}`, borderRadius: 16, padding: 18, marginBottom: 16, textAlign: "center" }}>
          <div style={{ fontSize: 13, color: T.textSec, marginBottom: 2 }}>Porteføljen varer i</div>
          <div style={{ fontSize: 34, fontWeight: 800, color: result.depYear ? T.red : T.green }}>{result.depYear ? `${result.depYear} år` : "60+ år"}</div>
        </div>
        <div className="stat-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
          <StatBox label="Uttaksrate" value={fmtPct((expense / port) * 100)} color={(expense / port) <= 0.04 ? T.green : T.orange} sub={(expense / port) <= 0.04 ? "Innenfor 4%-regelen" : "Over 4%-regelen"} />
          {showMC && result.survivalRate !== null ? (<StatBox label="Overlevelsesrate" value={fmtPct(result.survivalRate, 0)} color={result.survivalRate >= 90 ? T.green : result.survivalRate >= 70 ? T.orange : T.red} sub="Monte Carlo (500 sim.)" />) : (<StatBox label="Gevinst" value={fmtKr(port - costBasis)} color={T.green} />)}
          <StatBox label="Akkum. skjerming" value={fmtKr(result.cumSkj)} color={T.teal} sub={`${fmtPct(SKJERMINGSRENTE * 100)} · ${isASK ? "ASK" : "VPS"}`} />
          <StatBox label="Total skatt" value={fmtKr(result.totTax + result.totWT)} color={T.red} sub={`Uttak: ${fmtKr(result.totTax)} · Formue: ${fmtKr(result.totWT)}`} />
        </div>
        {showMC && result.pData.p10.length > 1 ? (
          <CB style={{ padding: 12 }}><MCChart data={result.pData} det={result.data} width={380} height={120} maxY={result.maxY} /></CB>
        ) : (
          <CB style={{ padding: 12 }}><IChart data={result.data} color={result.depYear ? T.red : T.green} title="Porteføljeverdi over tid" yFormat={v => fmtKr(v)} xFormat={i => `År ${i}`} height={120} /></CB>
        )}
      </div>
    </div>
    <div style={{ marginTop: 18, padding: 14, background: T.surfaceAlt, borderRadius: 12, border: `1px solid ${T.border}` }}>
      <div style={{ fontSize: 11, color: T.textTer, lineHeight: 1.7 }}><strong style={{ color: T.textSec }}>Skattemodell ({isASK ? "ASK" : "VPS"}):</strong> {isASK ? "Skjermingsfradrag akkumuleres årlig og rulles videre. Ved uttak beskattes gevinstdelen minus akkumulert skjerming." : "Skatt på gevinstdelen ved hvert uttak."} Eff. sats: {fmtPct(EFF_SKATT * 100)}. Formuesskatt: {fmtPct(FORMUE_S1 * 100)}/{fmtPct(FORMUE_S2 * 100)}. Verdsettelsesrabatt: {fmtPct(VERDI_RABATT * 100, 0)}.</div>
    </div>
  </div>);
}

function MCChart({ data, det, width = 380, height = 120, maxY }) {
  const all = [...data.p10, ...data.p90, ...det]; const mx = Math.max(...all), rng = mx || 1;
  const toY = v => height - (v / rng) * (height - 12) - 6; const toX = (i, l) => (i / (l - 1)) * width;
  const path = a => a.map((v, i) => `${toX(i, a.length)},${toY(v)}`).join(" ");
  const area = (t, b) => `${t.map((v, i) => `${toX(i, t.length)},${toY(v)}`).join(" ")} ${[...b].reverse().map((v, i) => `${toX(b.length - 1 - i, b.length)},${toY(v)}`).join(" ")}`;
  return (<div><svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ display: "block" }}>
    <polygon points={area(data.p90, data.p10)} fill={T.accent} opacity="0.08" /><polygon points={area(data.p75, data.p25)} fill={T.accent} opacity="0.18" />
    <polyline points={path(data.p50)} fill="none" stroke={T.accent} strokeWidth="2" strokeLinecap="round" /><polyline points={path(det)} fill="none" stroke={T.text} strokeWidth="1.5" strokeLinecap="round" strokeDasharray="4,3" opacity="0.5" /></svg>
    <div style={{ display: "flex", gap: 10, marginTop: 6, flexWrap: "wrap" }}>{[{ l: "Determ.", c: T.text }, { l: "Median", c: T.accent }, { l: "P25–P75", c: "rgba(41,151,255,0.3)" }, { l: "P10–P90", c: "rgba(41,151,255,0.12)" }].map(x => (<div key={x.l} style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 10, height: 4, borderRadius: 2, background: x.c }} /><span style={{ fontSize: 10, color: T.textTer }}>{x.l}</span></div>))}</div>
    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2, fontSize: 10, color: T.textTer }}><span>År 0</span><span>År {maxY}</span></div>
  </div>);
}

// ══════════════════════════════════════
// TOOL 3: Fee Impact
// ══════════════════════════════════════
function FeeImpact() {
  const [init, setInit] = useState(1000000); const [mth, setMth] = useState(5000); const [yrs, setYrs] = useState(30); const [gross, setGross] = useState(8);
  const [f1, setF1] = useState(0.15); const [f2, setF2] = useState(0.75); const [f3, setF3] = useState(1.50); const [plat, setPlat] = useState(0); const [showTbl, setShowTbl] = useState(false);
  const calc = useCallback(fee => { const nr = (gross - fee - plat) / 100 / 12; let b = init; const d = [b], yl = []; for (let m = 1; m <= yrs * 12; m++) { b = b * (1 + nr) + mth; if (m % 12 === 0) { yl.push(b); d.push(b); } } return { f: b, d, yl }; }, [init, mth, yrs, gross, plat]);
  const r0 = useMemo(() => calc(0), [calc]); const r1 = useMemo(() => calc(f1), [calc, f1]); const r2 = useMemo(() => calc(f2), [calc, f2]); const r3 = useMemo(() => calc(f3), [calc, f3]);
  const sc = [{ l: "Ingen kostnad", r: r0, c: T.green }, { l: `${fmtPct(f1)} TER`, r: r1, c: T.accent }, { l: `${fmtPct(f2)} TER`, r: r2, c: T.orange }, { l: `${fmtPct(f3)} TER`, r: r3, c: T.red }];
  return (<div>
    <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1.15fr", gap: 28 }}>
      <div><SL>Parametere</SL>
        <Slider label="Startbeløp" value={init} onChange={setInit} min={0} max={10000000} step={50000} format={v => fmtKr(v)} />
        <Slider label="Månedlig sparing" value={mth} onChange={setMth} min={0} max={50000} step={500} format={v => fmtKr(v)} />
        <Slider label="Tidshorisont" value={yrs} onChange={setYrs} min={5} max={50} suffix=" år" decimals={0} />
        <Slider label="Brutto avkastning" value={gross} onChange={setGross} min={2} max={15} step={0.25} suffix=" %" />
        <Slider label="Plattformkostnad" value={plat} onChange={setPlat} min={0} max={0.5} step={0.01} suffix=" %" />
        <div style={{ marginTop: 6, padding: 14, background: T.surfaceAlt, borderRadius: 12, border: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 11, color: T.textTer, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 10 }}>Forvaltningskostnader (TER)</div>
          <Slider label="Alt. A (indeksfond)" value={f1} onChange={setF1} min={0} max={1} step={0.01} suffix=" %" />
          <Slider label="Alt. B (aktivt fond)" value={f2} onChange={setF2} min={0} max={2} step={0.05} suffix=" %" />
          <Slider label="Alt. C (dyrt fond)" value={f3} onChange={setF3} min={0.5} max={3} step={0.05} suffix=" %" />
        </div></div>
      <div><SL>Kostnadens effekt over {yrs} år</SL>
        <div style={{ background: T.redGlow, border: "1px solid rgba(255,69,58,0.15)", borderRadius: 16, padding: 18, marginBottom: 16, textAlign: "center" }}>
          <div style={{ fontSize: 13, color: T.textSec, marginBottom: 4 }}>Forskjell: {fmtPct(f1)} vs {fmtPct(f3)}</div>
          <div style={{ fontSize: 34, fontWeight: 800, color: T.red }}>{fmtKr(r1.f - r3.f)}</div>
          <div style={{ fontSize: 12, color: T.textSec, marginTop: 4 }}>tapt til forvaltningskostnader</div></div>
        <div className="stat-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>{sc.map(s => <StatBox key={s.l} label={s.l} value={fmtKr(s.r.f)} color={s.c} sub={`Tapt: ${fmtKr(r0.f - s.r.f)}`} />)}</div>
        <CB label="Verdiutvikling"><MultiLineChart datasets={sc.map(s => ({ data: s.r.d, color: s.c, label: s.l }))} labels height={100} /></CB>
        <button onClick={() => setShowTbl(!showTbl)} style={{ marginTop: 12, background: "none", border: `1px solid ${T.border}`, borderRadius: 8, padding: "7px 14px", color: T.textSec, cursor: "pointer", fontSize: 12, fontWeight: 500, width: "100%" }}>{showTbl ? "Skjul" : "Vis"} tabell ▾</button></div></div>
    {showTbl && <div style={{ marginTop: 20, overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
      <thead><tr style={{ borderBottom: `1px solid ${T.border}` }}><th style={thS}>År</th><th style={thS}>0%</th><th style={{ ...thS, color: T.accent }}>{fmtPct(f1)}</th><th style={{ ...thS, color: T.orange }}>{fmtPct(f2)}</th><th style={{ ...thS, color: T.red }}>{fmtPct(f3)}</th><th style={{ ...thS, color: T.red }}>Tapt</th></tr></thead>
      <tbody>{r0.yl.filter((_, i) => i % Math.max(1, Math.floor(yrs / 15)) === 0 || i === r0.yl.length - 1).map((_, fi, arr) => { const i = fi === arr.length - 1 ? r0.yl.length - 1 : fi * Math.max(1, Math.floor(yrs / 15)); return (<tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}><Td sec>{i + 1}</Td><Td bold>{fmtKr(r0.yl[i])}</Td><Td color={T.accent}>{fmtKr(r1.yl[i])}</Td><Td color={T.orange}>{fmtKr(r2.yl[i])}</Td><Td color={T.red}>{fmtKr(r3.yl[i])}</Td><Td color={T.red}>{fmtKr(r1.yl[i] - r3.yl[i])}</Td></tr>); })}</tbody></table></div>}
  </div>);
}

// ══════════════════════════════════════
// TOOL 4: FIRE
// ══════════════════════════════════════
function FIRE() {
  const [inc, setInc] = useState(800000); const [exp, setExp] = useState(450000); const [sav, setSav] = useState(1500000);
  const [ret, setRet] = useState(7); const [swr, setSwr] = useState(3.5); const [age, setAge] = useState(35);
  const as = inc - exp, sr = inc > 0 ? (as / inc) * 100 : 0, fn = exp / (swr / 100) * 1.15;
  let y = 0, b = sav; const cd = [b]; while (b < fn && y < 80) { b = b * (1 + ret / 100) + as; y++; cd.push(b); }
  return (<div><div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1.15fr", gap: 28 }}>
    <div><SL>Parametere</SL>
      <Slider label="Årsinntekt" value={inc} onChange={setInc} min={0} max={3000000} step={50000} format={v => fmtKr(v)} />
      <Slider label="Årlige utgifter" value={exp} onChange={setExp} min={100000} max={2000000} step={25000} format={v => fmtKr(v)} />
      <Slider label="Nåværende sparing" value={sav} onChange={setSav} min={0} max={20000000} step={100000} format={v => fmtKr(v)} />
      <Slider label="Forventet avkastning" value={ret} onChange={setRet} min={0} max={15} step={0.25} suffix=" %" />
      <Slider label="Trygg uttaksrate" value={swr} onChange={setSwr} min={2} max={6} step={0.25} suffix=" %" />
      <Slider label="Alder" value={age} onChange={setAge} min={18} max={65} suffix=" år" decimals={0} /></div>
    <div><SL>FIRE-analyse</SL>
      <div style={{ background: y < 80 ? T.greenGlow : T.orangeGlow, border: `1px solid ${y < 80 ? "rgba(48,209,88,0.15)" : "rgba(255,159,10,0.15)"}`, borderRadius: 16, padding: 18, marginBottom: 16, textAlign: "center" }}>
        <div style={{ fontSize: 13, color: T.textSec, marginBottom: 2 }}>Økonomisk uavhengig ved</div>
        <div style={{ fontSize: 34, fontWeight: 800, color: y < 80 ? T.green : T.orange }}>{y < 80 ? `${age + y} år` : "80+"}</div></div>
      <div className="stat-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
        <StatBox label="FIRE-tall" value={fmtKr(fn)} color={T.accent} sub="Inkl. skatteeffekt" />
        <StatBox label="Sparerate" value={fmtPct(sr)} color={sr >= 50 ? T.green : sr >= 30 ? T.orange : T.red} />
        <StatBox label="Mnd. sparing" value={fmtKr(as / 12)} color={as > 0 ? T.green : T.red} />
        <StatBox label="Gjenstår" value={fmtKr(Math.max(0, fn - sav))} /></div>
      <CB style={{ padding: 12 }}><IChart data={cd} color={T.green} title="Vei til FIRE" yFormat={v => fmtKr(v)} xFormat={i => `${age + i} år`} height={110} /></CB></div></div></div>);
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
function InfoTip({ text }) {
  const [show, setShow] = useState(false);
  return (<span style={{ position: "relative", display: "inline-block" }}>
    <span onClick={() => setShow(!show)} style={{ cursor: "pointer", fontSize: 12, color: T.accent, fontWeight: 700, marginLeft: 4, userSelect: "none" }}>?</span>
    {show && <div style={{ position: "absolute", bottom: "100%", left: "50%", transform: "translateX(-50%)", width: 260, padding: 12, background: "rgba(16,16,20,0.97)", border: `1px solid ${T.border}`, borderRadius: 10, fontSize: 11.5, color: T.textSec, lineHeight: 1.6, zIndex: 100, marginBottom: 6 }} onClick={() => setShow(false)}>{text}</div>}
  </span>);
}

function MarketPulse() {
  const indicators = [
    { cat: "Verdsettelse", items: [
      { n: "S&P 500 P/E (TTM)", v: "26,6", s: "warn", d: "20-års snitt: 25,3.", info: "Price-to-Earnings ratio måler markedspris relativt til inntjening. Høy P/E kan bety at markedet priser inn sterk fremtidig vekst — eller at aksjer er overpriset. Historisk har svært høye P/E-nivåer vært etterfulgt av lavere avkastning neste 10 år." },
      { n: "Shiller CAPE", v: "37,6", s: "danger", d: "37% over 20-års snitt.", info: "Cyclically Adjusted P/E bruker 10 års inflasjonsjustert inntjening for å jevne ut konjunkturer. Utviklet av Robert Shiller. CAPE over 30 har historisk vært etterfulgt av betydelige markedskorreksjoner (20%+). Gjennomsnitt: ~17. Kun overgått i 1999-2000." },
      { n: "Forward P/E", v: "22,9", s: "warn", d: "Median: 18,2.", info: "Basert på analytikernes estimater for neste 12 måneders inntjening. Mer fremoverskuende enn TTM P/E, men avhengig av at estimatene treffer. Ofte for optimistiske i nedgangstider." },
      { n: "Buffett Indicator", v: "~230%", s: "danger", d: "Buffett: >120% = overvurdert.", info: "Total markedsverdi / BNP. Warren Buffett kalte dette 'det beste enkeltmålet på verdsettelse'. Over 120% signaliserer historisk overvurdering. Nåværende nivå er ~2,4 standardavvik over snittet. Svakheter: fanger ikke opp at store selskaper tjener mye utenlands." },
    ]},
    { cat: "Sentiment", items: [
      { n: "CNN Fear & Greed", v: "23", s: "opportunity", d: "Extreme Fear.", info: "Sammensatt indeks (0-100) basert på 7 markedsindikatorer: VIX, markedsmomentum, put/call-ratio, junk bond-etterspørsel, markedsbredde, safe haven-etterspørsel og aksjekurs-styrke. Under 25 = Extreme Fear. Historisk har Extreme Fear-perioder vært gode kjøpspunkter for langsiktige investorer." },
      { n: "Crypto F&G", v: "~26", s: "opportunity", d: "34 dager Extreme Fear.", info: "Kryptomarkedets sentimentindeks. Basert på volatilitet, volum, sosiale medier, BTC-dominans og Google Trends. All-time low (5) ble registrert 6. februar 2026. Tidligere lignende perioder har vært etterfulgt av kraftige oppturer." },
      { n: "VIX", v: "~26", s: "warn", d: "Snitt ~19. Over 30 = krise.", info: "CBOE Volatility Index — 'fryktindeksen'. Måler forventet volatilitet i S&P 500 neste 30 dager, utledet fra opsjonspriser. Under 15 = rolig marked. 15-25 = normal. Over 25 = forhøyet. Over 30 = krise/panikk. Topper typisk under markedskrasj." },
    ]},
    { cat: "Renter & kreditt", items: [
      { n: "Fed Funds", v: "3,50–3,75%", s: "neutral", d: "3 kutt i 2025. Warsh ny Chair.", info: "Den amerikanske styringsrenten. Påvirker alle renter globalt. Fed kuttet 3 ganger i 2025 (fra 5,25-5,50%). Ny Fed Chair Kevin Warsh signaliserer forsiktig videre kutt. Markedet priser inn 1-2 kutt til i 2026." },
      { n: "US 10Y", v: "~4,29%", s: "neutral", d: "Referanserente globalt.", info: "10-års amerikanske statsobligasjoner — den viktigste enkeltrenten i verden. Påvirker boliglån, selskapslån og verdsettelse av aksjer (via diskonteringsrente). Høyere 10Y = lavere nåverdi av fremtidige kontantstrømmer = press på vekstaksjer." },
      { n: "HY Spread", v: "~3,5%", s: "neutral", d: "<4% normalt, >5% stress.", info: "High Yield spread — differansen mellom renten på high-yield (junk) obligasjoner og statsobligasjoner. Måler kredittrisikopremien. Under 4% = investorer er komfortable med risiko. Over 5% = stress. Over 8% = krise (2008: ~21%)." },
      { n: "Norges Bank", v: "4,00%", s: "neutral", d: "Neste møte 26. mars.", info: "Norsk styringsrente. Kuttet fra 4,50% til 4,00% gjennom 2025 (to kutt). Høy kjerneinflasjon i jan '26 (3,4% vs 2,9% forventet) skapte usikkerhet om videre kutt. DNB har avlyst forventninger om kutt. Rentevedtak 26. mars med ny rentebane." },
    ]},
    { cat: "Makro", items: [
      { n: "US BNP Q4'25", v: "~2,6%", s: "ok", d: "Over konsensus (2,0%).", info: "Annualisert BNP-vekst. Viser helsen i amerikansk økonomi. Over 2% = solid vekst. Goldman Sachs estimerer 2,6% for 2026. Arbeidsmarkedet er fortsatt sterkt. Risiko: Iran-konflikten kan dempe veksten." },
      { n: "US CPI", v: "~2,8%", s: "warn", d: "Kjerneinflasjon hardnakket.", info: "Consumer Price Index — amerikansk inflasjon. Fed's mål er 2,0%. Kjerneinflasjonen (ex. mat og energi) er mer relevant. 2,8% er over mål og gjør det vanskeligere for Fed å kutte renter aggressivt. Høy oljepris legger ekstra press." },
      { n: "Brent Crude", v: "$103", s: "danger", d: "Opp ~50% YTD. Hormuz.", info: "Internasjonal oljepris-benchmark. Opp kraftig etter US-israelske angrep på Iran og delvis stengning av Hormuz-sundet (7M fat/dag). EIA forventer Brent over $95 de neste 2 mnd, ned mot $70 i H2 2026. Høy oljepris = inflasjonspress = mindre rom for rentekutt." },
      { n: "S&P 500", v: "6 632", s: "warn", d: "Ned ~5% fra ATH (7 008).", info: "Hovedindeksen for amerikanske storselskaper (500 største). All-time high 7 008 i januar 2026. Nå ned ~5%. Goldman Sachs har kursmål 7 600 for YE2026. Tre uker med fall pga. oljepris og geopolitikk. Markedet rebounds mandag +1%." },
    ]},
  ];
  const sc = { ok: T.green, warn: T.orange, danger: T.red, neutral: T.textSec, opportunity: T.teal };
  const sl = { ok: "OK", warn: "Varsel", danger: "Risiko", neutral: "Nøytral", opportunity: "Mulighet" };

  return (<div>
    <div style={{ marginBottom: 20, padding: 16, background: "rgba(255,159,10,0.06)", border: "1px solid rgba(255,159,10,0.12)", borderRadius: 14 }}>
      <div style={{ fontSize: 13, color: T.orange, fontWeight: 600, marginBottom: 4 }}>Markedsoppsummering — 17. mars 2026</div>
      <div style={{ fontSize: 12.5, color: T.textSec, lineHeight: 1.7 }}>
        Extreme Fear i sentimentindikatorer etter tre uker med fall. Geopolitisk uro dominerer — US-Israeli angrep på Iran, Hormuz-sundet delvis stengt, Brent crude over $100. S&P 500 ned ~5% fra ATH men rebounders +1% mandag. Verdsettelsen er forhøyet (CAPE 37,6), men earnings-estimater holder seg. Norges Bank holder rente uendret (4,00%) med neste vedtak 26. mars. Fed Funds på 3,50-3,75% etter tre kutt i 2025.
      </div>
    </div>

    <CB label="Fear & Greed Index" style={{ marginBottom: 20 }}><FGGauge value={23} /></CB>

    <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      {indicators.map(cat => (
        <div key={cat.cat} style={{ background: T.surfaceAlt, borderRadius: 14, padding: 16, border: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 12, color: T.textTer, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 14, fontWeight: 600 }}>{cat.cat}</div>
          {cat.items.map(item => (
            <div key={item.n} style={{ marginBottom: 12, paddingBottom: 10, borderBottom: `1px solid ${T.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                <span style={{ fontSize: 13, color: T.text, fontWeight: 600 }}>{item.n}<InfoTip text={item.info} /></span>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: sc[item.s], fontVariantNumeric: "tabular-nums" }}>{item.v}</span>
                  <div style={{ padding: "2px 7px", borderRadius: 5, fontSize: 9.5, fontWeight: 600, background: `${sc[item.s]}20`, color: sc[item.s], textTransform: "uppercase" }}>{sl[item.s]}</div>
                </div></div>
              <div style={{ fontSize: 11, color: T.textTer, lineHeight: 1.5 }}>{item.d}</div>
            </div>))}
        </div>))}
    </div>
    <div style={{ marginTop: 16, fontSize: 11, color: T.textTer, textAlign: "center" }}>
      Tallene er manuelt oppdatert pr. 17. mars 2026 og kan være noe forsinkede. Ikke investeringsrådgivning.
    </div>
  </div>);
}

function FGGauge({ value }) {
  const ang = 180 - (value / 100) * 180, rad = ang * Math.PI / 180;
  const cx = 130, cy = 120, len = 72;
  const nx = cx + len * Math.cos(rad), ny = cy - len * Math.sin(rad);
  const gl = v => v <= 25 ? "Extreme Fear" : v <= 45 ? "Fear" : v <= 55 ? "Neutral" : v <= 75 ? "Greed" : "Extreme Greed";
  const gc = v => v <= 25 ? T.red : v <= 45 ? T.orange : v <= 55 ? T.textSec : v <= 75 ? T.green : T.teal;
  return (<div style={{ textAlign: "center", padding: "10px 0" }}>
    <svg width="260" height="155" viewBox="0 0 260 155">
      <defs><linearGradient id="fgg" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor={T.red} /><stop offset="25%" stopColor={T.orange} /><stop offset="50%" stopColor={T.yellow} /><stop offset="75%" stopColor={T.green} /><stop offset="100%" stopColor={T.teal} /></linearGradient></defs>
      <path d="M 30 125 A 100 100 0 0 1 230 125" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="18" strokeLinecap="round" />
      <path d="M 30 125 A 100 100 0 0 1 230 125" fill="none" stroke="url(#fgg)" strokeWidth="18" strokeLinecap="round" opacity="0.75" />
      <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={T.text} strokeWidth="2.5" strokeLinecap="round" style={{ transition: "all 0.6s ease" }} />
      <circle cx={cx} cy={cy} r="5" fill={T.text} />
      <text x={cx} y={105} textAnchor="middle" fill={gc(value)} fontSize="30" fontWeight="800" fontFamily="SF Pro Display,-apple-system,sans-serif">{value}</text>
      <text x={cx} y={120} textAnchor="middle" fill={T.textSec} fontSize="12">{gl(value)}</text>
      <text x="30" y="148" fill={T.textTer} fontSize="10" textAnchor="middle">0</text>
      <text x="130" y="20" fill={T.textTer} fontSize="10" textAnchor="middle">50</text>
      <text x="230" y="148" fill={T.textTer} fontSize="10" textAnchor="middle">100</text>
    </svg>
  </div>);
}

// ══ Main ══
const tools = [
  { id: "compound", label: "Rentes rente", icon: "📈" },
  { id: "wealth", label: "Wealth Planner", icon: "🏦" },
  { id: "feeimpact", label: "Kostnadseffekt", icon: "💸" },
  { id: "fire", label: "FIRE", icon: "🔥" },
  { id: "loan", label: "Lånekalkulator", icon: "🏠" },
  { id: "market", label: "Markedspuls", icon: "🌍" },
];

export default function App() {
  const [active, setActive] = useState("compound");
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const render = () => { switch (active) { case "compound": return <CompoundCalc />; case "wealth": return <WealthPlanner />; case "feeimpact": return <FeeImpact />; case "fire": return <FIRE />; case "loan": return <Loan />; case "market": return <MarketPulse />; default: return null; } };

  return (<div style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: "'SF Pro Display',-apple-system,'Helvetica Neue',sans-serif", opacity: mounted ? 1 : 0, transition: "opacity 0.5s ease" }}>
    <style>{MOBILE_CSS}</style>
    <div className="main-padding" style={{ padding: "28px 36px 0", maxWidth: 1120, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4, flexWrap: "wrap" }}>
        <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-0.03em", background: "linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.55) 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Finansverktøy</h1>
        <span style={{ fontSize: 12, color: T.textTer, letterSpacing: "0.05em", textTransform: "uppercase" }}>Private Banking</span></div>
      <p style={{ fontSize: 14, color: T.textSec, marginBottom: 24, lineHeight: 1.5 }}>Kalkulatorer og analyseverktøy med norske skatteregler</p></div>
    <div className="content-padding" style={{ maxWidth: 1120, margin: "0 auto", padding: "0 36px" }}>
      <div className="tab-bar" style={{ display: "flex", gap: 4, overflowX: "auto", paddingBottom: 3, borderBottom: `1px solid ${T.border}`, marginBottom: 24, WebkitOverflowScrolling: "touch" }}>
        {tools.map(t => <button key={t.id} onClick={() => setActive(t.id)} style={{ padding: "9px 16px", border: "none", borderRadius: "9px 9px 0 0", cursor: "pointer", fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", transition: "all 0.2s", background: active === t.id ? "rgba(255,255,255,0.05)" : "transparent", color: active === t.id ? T.text : T.textTer, borderBottom: active === t.id ? `2px solid ${T.accent}` : "2px solid transparent" }}>{t.icon} {t.label}</button>)}</div></div>
    <div className="bottom-padding" style={{ maxWidth: 1120, margin: "0 auto", padding: "0 36px 50px" }}>
      <Card className="card-padding" glow={T.accentGlow}>{render()}</Card>
      <div style={{ marginTop: 20, textAlign: "center", fontSize: 11.5, color: T.textTer }}>Verktøyene er ment som veiledning og erstatter ikke profesjonell rådgivning.</div></div></div>);
}
