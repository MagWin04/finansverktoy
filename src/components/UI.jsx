import { useState, useRef, useId } from "react";
import { fmt, fmtCompact, parseAmount, wealthToPos, posToWealth } from "../utils/format";

export const T = {
  bg: "#08090a",
  surface: "#111214",
  surfaceAlt: "rgba(255,255,255,0.025)",
  border: "rgba(255,255,255,0.06)",
  borderLight: "rgba(255,255,255,0.12)",
  text: "#f5f5f7",
  textSec: "rgba(255,255,255,0.58)",
  textTer: "rgba(255,255,255,0.34)",
  accent: "#2997ff",
  accentGlow: "rgba(41,151,255,0.12)",
  green: "#30d158",
  greenGlow: "rgba(48,209,88,0.12)",
  orange: "#ff9f0a",
  orangeGlow: "rgba(255,159,10,0.12)",
  red: "#ff453a",
  redGlow: "rgba(255,69,58,0.12)",
  purple: "#bf5af2",
  teal: "#64d2ff"
};

export const DEFAULT_WEALTH_PRESETS = [
  { label: "10M", val: 10_000_000 },
  { label: "25M", val: 25_000_000 },
  { label: "50M", val: 50_000_000 },
  { label: "100M", val: 100_000_000 },
  { label: "250M", val: 250_000_000 },
  { label: "500M", val: 500_000_000 },
  { label: "1 MRD", val: 1_000_000_000 }
];

export const thS = {
  padding: "8px 10px",
  textAlign: "right",
  color: T.textTer,
  fontWeight: 500,
  fontSize: 10.5,
  textTransform: "uppercase",
  letterSpacing: "0.04em"
};

export function Td({ children, bold, sec, color, left }) {
  return (
    <td
      style={{
        padding: "8px 10px",
        textAlign: left ? "left" : "right",
        fontVariantNumeric: "tabular-nums",
        color: color || (sec ? T.textSec : T.text),
        fontWeight: bold ? 600 : 400,
        fontSize: 12.5
      }}
    >
      {children}
    </td>
  );
}

export function SegmentedControl({ label, options, value, onChange, columns }) {
  const cols = columns || options.length;
  return (
    <div style={{ marginBottom: 18 }}>
      {label && <div style={{ fontSize: 13, color: T.textSec, marginBottom: 8 }}>{label}</div>}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 6 }}>
        {options.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              style={{
                padding: "9px 8px",
                border: `1px solid ${active ? T.accent : T.border}`,
                borderRadius: 9,
                background: active ? T.accentGlow : "transparent",
                color: active ? T.accent : T.textSec,
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600,
                transition: "all 0.15s ease"
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function WealthSlider({
  label,
  value,
  onChange,
  max = 1_000_000_000,
  presets = DEFAULT_WEALTH_PRESETS,
  sublabel
}) {
  const [editing, setEditing] = useState(false);
  const [ev, setEv] = useState("");
  const ref = useRef(null);

  const clamped = Math.max(0, Math.min(max, value));
  const pos = wealthToPos(clamped);

  const startEdit = () => {
    setEv(String(clamped));
    setEditing(true);
    setTimeout(() => ref.current?.select(), 10);
  };

  const commit = () => {
    setEditing(false);
    const parsed = parseAmount(ev);
    if (!isNaN(parsed)) {
      onChange(Math.max(0, Math.min(max, Math.round(parsed))));
    }
  };

  const onKey = (e) => {
    if (e.key === "Enter") commit();
    if (e.key === "Escape") setEditing(false);
  };

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
        <div>
          <label style={{ fontSize: 13, color: T.textSec }}>{label}</label>
          {sublabel && <span style={{ fontSize: 11, color: T.textTer, marginLeft: 6 }}>{sublabel}</span>}
        </div>
        {editing ? (
          <input
            ref={ref}
            type="text"
            value={ev}
            onChange={(e) => setEv(e.target.value)}
            onBlur={commit}
            onKeyDown={onKey}
            placeholder="F.eks. 45m"
            style={{
              width: 140,
              textAlign: "right",
              background: "rgba(255,255,255,0.08)",
              border: `1px solid ${T.accent}`,
              borderRadius: 6,
              color: T.text,
              fontSize: 13,
              fontWeight: 600,
              padding: "3px 8px",
              outline: "none",
              fontVariantNumeric: "tabular-nums"
            }}
          />
        ) : (
          <span
            onClick={startEdit}
            title="Klikk for å skrive beløp (f.eks. 45m eller 1mrd)"
            style={{
              fontSize: 13.5,
              color: T.text,
              fontWeight: 600,
              fontVariantNumeric: "tabular-nums",
              cursor: "text",
              padding: "2px 6px",
              borderRadius: 5,
              border: "1px solid transparent",
              transition: "border-color 0.15s"
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = T.borderLight)}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "transparent")}
          >
            {fmtCompact(clamped)}
          </span>
        )}
      </div>

      <div style={{ position: "relative", height: 5, background: "rgba(255,255,255,0.07)", borderRadius: 3 }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            height: "100%",
            width: `${pos}%`,
            background: `linear-gradient(90deg, ${T.accent}, ${T.teal})`,
            borderRadius: 3
          }}
        />
        <input
          type="range"
          min={0}
          max={100}
          step={0.25}
          value={pos}
          onChange={(e) => onChange(Math.min(max, posToWealth(Number(e.target.value))))}
          style={{
            position: "absolute",
            top: -10,
            left: 0,
            width: "100%",
            height: 24,
            opacity: 0,
            cursor: "pointer",
            margin: 0
          }}
        />
        <div
          style={{
            position: "absolute",
            top: -4,
            left: `calc(${pos}% - 6.5px)`,
            width: 13,
            height: 13,
            borderRadius: "50%",
            background: T.text,
            boxShadow: "0 1px 6px rgba(0,0,0,0.45)",
            pointerEvents: "none"
          }}
        />
      </div>

      {presets && (
        <div className="preset-row">
          {presets.filter((p) => p.val <= max).map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => onChange(p.val)}
              className={`preset-btn ${clamped === p.val ? "active" : ""}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function Slider({ label, value, onChange, min, max, step = 1, suffix = "", format, decimals }) {
  const [editing, setEditing] = useState(false);
  const [ev, setEv] = useState("");
  const ref = useRef(null);
  const clamped = Math.max(min, Math.min(max, value));
  const pct = Math.max(0, Math.min(100, ((clamped - min) / (max - min || 1)) * 100));
  const dec = decimals ?? (step < 1 ? Math.max(1, String(step).split(".")[1]?.length || 1) : 0);

  const startEdit = () => {
    setEv(String(clamped));
    setEditing(true);
    setTimeout(() => ref.current?.select(), 10);
  };

  const commit = () => {
    setEditing(false);
    const p = parseAmount(ev);
    if (!isNaN(p)) {
      onChange(Math.max(min, Math.min(max, Math.round(p / step) * step)));
    }
  };

  const dv = format ? format(clamped) : `${fmt(clamped, dec)}${suffix}`;

  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
        <label style={{ fontSize: 13, color: T.textSec }}>{label}</label>
        {editing ? (
          <input
            ref={ref}
            type="text"
            value={ev}
            onChange={(e) => setEv(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") setEditing(false);
            }}
            style={{
              width: 120,
              textAlign: "right",
              background: "rgba(255,255,255,0.08)",
              border: `1px solid ${T.accent}`,
              borderRadius: 6,
              color: T.text,
              fontSize: 13,
              fontWeight: 600,
              padding: "3px 8px",
              outline: "none",
              fontVariantNumeric: "tabular-nums"
            }}
          />
        ) : (
          <span
            onClick={startEdit}
            title="Klikk for å redigere"
            style={{
              fontSize: 13,
              color: T.text,
              fontWeight: 600,
              fontVariantNumeric: "tabular-nums",
              cursor: "text",
              padding: "2px 6px",
              borderRadius: 5,
              border: "1px solid transparent"
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = T.borderLight)}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "transparent")}
          >
            {dv}
          </span>
        )}
      </div>
      <div style={{ position: "relative", height: 5, background: "rgba(255,255,255,0.07)", borderRadius: 3 }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            height: "100%",
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${T.accent}, ${T.teal})`,
            borderRadius: 3
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={clamped}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{
            position: "absolute",
            top: -10,
            left: 0,
            width: "100%",
            height: 24,
            opacity: 0,
            cursor: "pointer",
            margin: 0
          }}
        />
        <div
          style={{
            position: "absolute",
            top: -4,
            left: `calc(${pct}% - 6.5px)`,
            width: 13,
            height: 13,
            borderRadius: "50%",
            background: T.text,
            boxShadow: "0 1px 6px rgba(0,0,0,0.4)",
            pointerEvents: "none"
          }}
        />
      </div>
    </div>
  );
}

export function Toggle({ label, value, onChange }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 13, color: T.textSec }}>
      <div
        onClick={() => onChange(!value)}
        style={{
          width: 40,
          height: 22,
          borderRadius: 11,
          position: "relative",
          background: value ? T.accent : "rgba(255,255,255,0.12)",
          transition: "background 0.2s",
          flexShrink: 0
        }}
      >
        <div
          style={{
            width: 18,
            height: 18,
            borderRadius: 9,
            background: "#fff",
            position: "absolute",
            top: 2,
            left: value ? 20 : 2,
            transition: "left 0.2s",
            boxShadow: "0 1px 4px rgba(0,0,0,0.3)"
          }}
        />
      </div>
      {label}
    </label>
  );
}

export function Card({ children, style, glow }) {
  return (
    <div
      style={{
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: 20,
        padding: 26,
        position: "relative",
        overflow: "hidden",
        ...style
      }}
    >
      {glow && (
        <div
          style={{
            position: "absolute",
            top: -80,
            right: -80,
            width: 220,
            height: 220,
            background: glow,
            borderRadius: "50%",
            filter: "blur(80px)",
            opacity: 0.35,
            pointerEvents: "none"
          }}
        />
      )}
      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
    </div>
  );
}

export function StatBox({ label, value, color, sub }) {
  return (
    <div style={{ background: T.surfaceAlt, borderRadius: 14, padding: "14px 16px", border: `1px solid ${T.border}` }}>
      <div style={{ fontSize: 10.5, color: T.textTer, marginBottom: 5, letterSpacing: "0.04em", textTransform: "uppercase" }}>
        {label}
      </div>
      <div style={{ fontSize: 19, fontWeight: 700, color: color || T.text, fontVariantNumeric: "tabular-nums", lineHeight: 1.2 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export function SectionTitle({ children, style }) {
  return <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: T.text, ...style }}>{children}</h3>;
}

export function ChartBox({ label, children, style }) {
  return (
    <div style={{ background: T.surfaceAlt, borderRadius: 12, padding: 14, border: `1px solid ${T.border}`, ...style }}>
      {label && (
        <div style={{ fontSize: 10.5, color: T.textTer, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.04em" }}>
          {label}
        </div>
      )}
      {children}
    </div>
  );
}

export function InteractiveChart({ data, width = 340, height = 95, color = T.accent, labels, formatY, formatX }) {
  const [hover, setHover] = useState(null);
  const svgRef = useRef(null);
  const gid = useId();
  if (!data || data.length < 2) return null;

  const mx = Math.max(...data);
  const mn = Math.min(...data, 0);
  const rng = mx - mn || 1;
  const pad = 4;
  const toX = (i) => (i / (data.length - 1)) * width;
  const toY = (v) => height - ((v - mn) / rng) * (height - pad * 2) - pad;
  const pts = data.map((v, i) => `${toX(i)},${toY(v)}`).join(" ");

  const onMove = (e) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * width;
    const idx = Math.round((x / width) * (data.length - 1));
    if (idx >= 0 && idx < data.length) setHover(idx);
  };

  return (
    <div style={{ position: "relative" }} onMouseLeave={() => setHover(null)}>
      <svg
        ref={svgRef}
        width="100%"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        style={{ display: "block", cursor: "crosshair" }}
        onMouseMove={onMove}
      >
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.24" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={`0,${height} ${pts} ${width},${height}`} fill={`url(#${gid})`} />
        <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {hover !== null && (
          <>
            <line x1={toX(hover)} y1={0} x2={toX(hover)} y2={height} stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeDasharray="3,3" />
            <circle cx={toX(hover)} cy={toY(data[hover])} r="4" fill={color} stroke={T.text} strokeWidth="1.5" />
          </>
        )}
      </svg>
      {hover !== null && (
        <div
          style={{
            position: "absolute",
            top: -10,
            left: `${Math.min(Math.max((toX(hover) / width) * 100, 15), 85)}%`,
            transform: "translateX(-50%)",
            background: "rgba(18,19,22,0.96)",
            border: `1px solid ${T.borderLight}`,
            borderRadius: 8,
            padding: "5px 10px",
            pointerEvents: "none",
            whiteSpace: "nowrap",
            zIndex: 10
          }}
        >
          {formatX && <div style={{ fontSize: 10, color: T.textTer }}>{formatX(hover)}</div>}
          <div style={{ fontSize: 12.5, fontWeight: 700, color, fontVariantNumeric: "tabular-nums" }}>
            {formatY ? formatY(data[hover]) : fmtCompact(data[hover])}
          </div>
        </div>
      )}
      {labels && (
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 10, color: T.textTer }}>
          <span>{labels[0]}</span>
          <span>{labels[1]}</span>
        </div>
      )}
    </div>
  );
}

export function MultiLineChart({ datasets, width = 340, height = 110, labels }) {
  const baseId = useId();
  if (!datasets?.length) return null;
  const all = datasets.flatMap((d) => d.data);
  const mx = Math.max(...all, 1);
  const mn = Math.min(...all, 0);
  const rng = mx - mn || 1;

  return (
    <div>
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ display: "block" }}>
        <defs>
          {datasets.map((d, i) => (
            <linearGradient key={i} id={`${baseId}-${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={d.color} stopOpacity="0.14" />
              <stop offset="100%" stopColor={d.color} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>
        {datasets.map((d, di) => {
          const pts = d.data
            .map((v, i) => `${(i / (d.data.length - 1)) * width},${height - ((v - mn) / rng) * (height - 8) - 4}`)
            .join(" ");
          return (
            <g key={di}>
              <polygon points={`0,${height} ${pts} ${width},${height}`} fill={`url(#${baseId}-${di})`} />
              <polyline
                points={pts}
                fill="none"
                stroke={d.color}
                strokeWidth={di === 0 ? "2.4" : "2"}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={d.dashed ? "5,4" : "none"}
              />
            </g>
          );
        })}
      </svg>
      {labels && (
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 10, color: T.textTer }}>
          <span>{labels[0]}</span>
          <span>{labels[1]}</span>
        </div>
      )}
      <div style={{ display: "flex", gap: 14, marginTop: 8, flexWrap: "wrap" }}>
        {datasets.map((d, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 12, height: 3, borderRadius: 2, background: d.color }} />
            <span style={{ fontSize: 11, color: T.textSec }}>{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MCChart({ data, det, width = 340, height = 110 }) {
  const all = [...data.p10, ...data.p90, ...det];
  const mx = Math.max(...all, 1);
  const toY = (v) => height - (v / mx) * (height - 8) - 4;
  const toX = (i, l) => (i / (l - 1)) * width;
  const path = (a) => a.map((v, i) => `${toX(i, a.length)},${toY(v)}`).join(" ");
  const area = (t, b) =>
    `${t.map((v, i) => `${toX(i, t.length)},${toY(v)}`).join(" ")} ${[...b]
      .reverse()
      .map((v, i) => `${toX(b.length - 1 - i, b.length)},${toY(v)}`)
      .join(" ")}`;

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ display: "block" }}>
      <polygon points={area(data.p90, data.p10)} fill={T.accent} opacity="0.09" />
      <polygon points={area(data.p75, data.p25)} fill={T.accent} opacity="0.2" />
      <polyline points={path(data.p50)} fill="none" stroke={T.accent} strokeWidth="2.2" strokeLinecap="round" />
      <polyline points={path(det)} fill="none" stroke={T.text} strokeWidth="1.5" strokeLinecap="round" strokeDasharray="4,3" opacity="0.55" />
    </svg>
  );
}
