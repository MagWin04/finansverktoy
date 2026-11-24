import { useState, useMemo } from "react";
import { TAX } from "../config/taxRates";
import { fmtCompact, fmtPct } from "../utils/format";
import { T, WealthSlider, Slider, Toggle, StatBox, SectionTitle, ChartBox, InteractiveChart } from "../components/UI";

export default function CompoundCalc() {
  const [init, setInit] = useState(10_000_000);
  const [monthly, setMonthly] = useState(50_000);
  const [rate, setRate] = useState(8.0);
  const [yrs, setYrs] = useState(20);
  const [infl, setInfl] = useState(2.5);
  const [showReal, setShowReal] = useState(true);
  const [showAfterTax, setShowAfterTax] = useState(false);

  const r = useMemo(() => {
    const mr = rate / 100 / 12;
    const months = yrs * 12;
    let b = init;
    let c = init;
    const series = [b];
    const investedSeries = [c];

    for (let m = 1; m <= months; m++) {
      b = b * (1 + mr) + monthly;
      c += monthly;
      if (m % 12 === 0) {
        series.push(b);
        investedSeries.push(c);
      }
    }

    const gain = Math.max(0, b - c);
    const estTax = showAfterTax ? gain * TAX.EFF_AKSJE_SKATT : 0;
    const afterTaxVal = b - estTax;
    const realVal = afterTaxVal / Math.pow(1 + infl / 100, yrs);
    const realRate = (1 + rate / 100) / (1 + infl / 100) - 1;

    return { b, c, gain, estTax, afterTaxVal, realVal, realRate, series, investedSeries };
  }, [init, monthly, rate, yrs, infl, showAfterTax]);

  return (
    <div>
      <div className="calc-grid">
        <div>
          <SectionTitle>Sparing og vekst</SectionTitle>
          <WealthSlider label="Startbeløp" value={init} onChange={setInit} />
          <Slider
            label="Månedlig sparing"
            value={monthly}
            onChange={setMonthly}
            min={0}
            max={500_000}
            step={5_000}
            format={(v) => fmtCompact(v)}
          />
          <Slider label="Forventet årlig avkastning" value={rate} onChange={setRate} min={0} max={18} step={0.25} suffix=" %" />
          <Slider label="Tidshorisont" value={yrs} onChange={setYrs} min={1} max={50} suffix=" år" decimals={0} />
          <Slider label="Inflasjon" value={infl} onChange={setInfl} min={0} max={6} step={0.25} suffix=" %" />
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
            <Toggle label="Vis inflasjonsjustert realverdi" value={showReal} onChange={setShowReal} />
            <Toggle label="Trekk fra estimert aksjeskatt (37,84 % av gevinst)" value={showAfterTax} onChange={setShowAfterTax} />
          </div>
        </div>

        <div>
          <SectionTitle>Resultat etter {yrs} år</SectionTitle>
          <div
            style={{
              background: T.accentGlow,
              border: "1px solid rgba(41,151,255,0.22)",
              borderRadius: 16,
              padding: 18,
              marginBottom: 16,
              textAlign: "center"
            }}
          >
            <div style={{ fontSize: 12.5, color: T.textSec, marginBottom: 3 }}>
              {showReal ? "Realverdi i dagens kroner" : "Forventet sluttverdi"}
            </div>
            <div style={{ fontSize: 34, fontWeight: 800, color: T.accent }}>
              {fmtCompact(showReal ? r.realVal : r.afterTaxVal)}
            </div>
            <div style={{ fontSize: 12, color: T.textSec, marginTop: 3 }}>
              Nominell verdi: {fmtCompact(r.b)} · Realavkastning: {fmtPct(r.realRate * 100)}
            </div>
          </div>

          <div className="stat-grid" style={{ marginBottom: 16 }}>
            <StatBox label="Nominell sluttverdi" value={fmtCompact(r.b)} color={T.text} />
            <StatBox label="Verdiøkning / gevinst" value={fmtCompact(r.gain)} color={T.green} />
            <StatBox label="Innbetalt totalt" value={fmtCompact(r.c)} color={T.textSec} />
            <StatBox
              label={showAfterTax ? "Estimert gevinstskatt" : "Kjøpekraftsjustert"}
              value={showAfterTax ? fmtCompact(r.estTax) : fmtCompact(r.realVal)}
              color={showAfterTax ? T.orange : T.teal}
            />
          </div>

          <ChartBox label="Rentes rente-kurve">
            <InteractiveChart
              data={r.series}
              color={T.accent}
              formatY={(v) => fmtCompact(v)}
              formatX={(i) => `År ${i}`}
              labels={["0 år", `${yrs} år`]}
            />
          </ChartBox>
        </div>
      </div>
    </div>
  );
}
