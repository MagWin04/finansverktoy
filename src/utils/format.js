export const fmt = (n, d = 0) =>
  new Intl.NumberFormat("nb-NO", {
    minimumFractionDigits: d,
    maximumFractionDigits: d
  }).format(Number.isFinite(n) ? n : 0);

export const fmtKr = (n) => `${fmt(n, 0)} kr`;

export const fmtCompact = (n) => {
  if (!Number.isFinite(n)) return "0 kr";
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `${fmt(n / 1_000_000_000, 2)} MRD`;
  if (abs >= 10_000_000) return `${fmt(n / 1_000_000, 1)} MNOK`;
  if (abs >= 1_000_000) return `${fmt(n / 1_000_000, 2)} MNOK`;
  return fmtKr(n);
};

export const fmtPct = (n, d = 1) => `${fmt(n, d)} %`;

export function parseAmount(str) {
  const clean = String(str).toLowerCase().replace(/\s/g, "").replace(",", ".");
  const match = clean.match(/^(-?\d*\.?\d+)(mrd|b|mnok|mill|m|k)?/);
  if (!match) return NaN;
  const num = parseFloat(match[1]);
  const unit = match[2];
  if (unit === "mrd" || unit === "b") return num * 1_000_000_000;
  if (unit === "mnok" || unit === "mill" || unit === "m") return num * 1_000_000;
  if (unit === "k") return num * 1_000;
  return num;
}

// Ikke-lineær skala fra 0 til 1 MRD der 50 % av lengden dekker 10 til 100 MNOK
const SEGMENTS = [
  { p0: 0, p1: 15, v0: 0, v1: 10_000_000, step: 500_000 },
  { p0: 15, p1: 65, v0: 10_000_000, v1: 100_000_000, step: 1_000_000 },
  { p0: 65, p1: 85, v0: 100_000_000, v1: 300_000_000, step: 5_000_000 },
  { p0: 85, p1: 100, v0: 300_000_000, v1: 1_000_000_000, step: 25_000_000 }
];

export function wealthToPos(val) {
  const clamped = Math.max(0, Math.min(1_000_000_000, val));
  for (const s of SEGMENTS) {
    if (clamped <= s.v1) {
      const ratio = (clamped - s.v0) / (s.v1 - s.v0);
      return s.p0 + ratio * (s.p1 - s.p0);
    }
  }
  return 100;
}

export function posToWealth(pos) {
  const clamped = Math.max(0, Math.min(100, pos));
  for (const s of SEGMENTS) {
    if (clamped <= s.p1) {
      const ratio = (clamped - s.p0) / (s.p1 - s.p0);
      const raw = s.v0 + ratio * (s.v1 - s.v0);
      return Math.round(raw / s.step) * s.step;
    }
  }
  return 1_000_000_000;
}

export function seededRandom(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

export function boxMuller(rng) {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}
