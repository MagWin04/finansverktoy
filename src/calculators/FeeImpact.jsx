import { useState, useMemo, useCallback } from "react";
import { fmtCompact, fmtPct } from "../utils/format";
import { T, WealthSlider, Slider, StatBox, SectionTitle, ChartBox, MultiLineChart } from "../components/UI";

export default function FeeImpact() {
  const [init, setInit] = useState(25_000_000);
  const [yrs, setYrs] = useState(20);
  const [gross, setGross] = useState(7.5);
  const [f1, setF1] = useState(0.15);
  const [f2, setF2] = useState(0.75);
  const [f3, setF3] = useState(1.50);

  const calc = useCallback(
    (fee) => {
      const nr = (gross - fee) / 100 / 12;
      let b = init;
      const d = [b];
      for (let m = 1; m <= yrs * 12; m++) {
        b = b * (1 + nr);
        if (m % 12 === 0) d.push(b);
      }
      return { f: b, d };
    },
    [init, yrs, gross]
  );

  const r1 = useMemo(() => calc(f1), [calc, f1]);
  const r2 = useMemo(() => calc(f2), [calc, f2]);
  const r3 = useMemo(() => calc(f3), [calc, f3]);

  return (
    <div>
      <div className="calc-grid">
        <div>
          <SectionTitle>Gebyrer og avkastning</SectionTitle>
          <WealthSlider label="Porteføljeverdi" value={init} onChange={setInit} />
          <Slider label="Tidshorisont" value={yrs} onChange={setYrs} min={5} max={40} suffix=" år" decimals={0} />
          <Slider label="Brutto avkastning før kostnader" value={gross} onChange={setGross} min={2} max={14} step={0.25} suffix=" %" />
          <Slider label="Lavkost indeksfond (årlig gebyr)" value={f1} onChange={setF1} min={0.05} max={0.8} step={0.05} suffix=" %" />
          <Slider label="Rådgivning / mellomnivå (årlig gebyr)" value={f2} onChange={setF2} min={0.2} max={2.0} step={0.05} suffix=" %" />
          <Slider label="Høyt gebyr / aktivt mandat (årlig gebyr)" value={f3} onChange={setF3} min={0.5} max={3.0} step={0.05} suffix=" %" />
        </div>

        <div>
          <SectionTitle>Kostnadens effekt over {yrs} år</SectionTitle>
          <div
            style={{
              background: T.redGlow,
              border: "1px solid rgba(255,69,58,0.18)",
              borderRadius: 16,
              padding: 18,
              marginBottom: 16,
              textAlign: "center"
            }}
          >
            <div style={{ fontSize: 12.5, color: T.textSec, marginBottom: 3 }}>
              Forskjell mellom {fmtPct(f1, 2)} og {fmtPct(f3, 2)} etter {yrs} år
            </div>
            <div style={{ fontSize: 34, fontWeight: 800, color: T.red }}>{fmtCompact(r1.f - r3.f)}</div>
            <div style={{ fontSize: 12, color: T.textSec, marginTop: 3 }}>
              Gebyr i år 1 ved {fmtPct(f3, 2)}: {fmtCompact((init * f3) / 100)}
            </div>
          </div>

          <div className="stat-grid" style={{ marginBottom: 16 }}>
            <StatBox label={`Lavkost (${fmtPct(f1, 2)})`} value={fmtCompact(r1.f)} color={T.green} />
            <StatBox label={`Mellom (${fmtPct(f2, 2)})`} value={fmtCompact(r2.f)} color={T.orange} />
            <StatBox label={`Høyt (${fmtPct(f3, 2)})`} value={fmtCompact(r3.f)} color={T.red} />
            <StatBox label="Gebyrdrap (lav vs. høy)" value={fmtCompact(r1.f - r3.f)} color={T.teal} />
          </div>

          <ChartBox label="Formuesutvikling ved ulike gebyrnivåer">
            <MultiLineChart
              datasets={[
                { data: r1.d, color: T.green, label: `Lavkost (${fmtPct(f1, 2)})` },
                { data: r2.d, color: T.orange, label: `Mellom (${fmtPct(f2, 2)})` },
                { data: r3.d, color: T.red, label: `Høyt (${fmtPct(f3, 2)})` }
              ]}
              labels={["0 år", `${yrs} år`]}
            />
          </ChartBox>
        </div>
      </div>
    </div>
  );
}
