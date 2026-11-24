import { useState, useMemo } from "react";
import { TAX, calcWealthTaxDetailed, grossUpDividend } from "../config/taxRates";
import { fmtCompact, fmtKr, fmtPct } from "../utils/format";
import { T, WealthSlider, Slider, Toggle, StatBox, SectionTitle, Td, thS } from "../components/UI";

export default function WealthTaxCalc() {
  const [wealth, setWealth] = useState(50_000_000);
  const [eqPct, setEqPct] = useState(80);
  const [debt, setDebt] = useState(0);
  const [married, setMarried] = useState(false);

  const d = useMemo(
    () => calcWealthTaxDetailed({ totalWealth: wealth, equityShare: eqPct / 100, debt, married }),
    [wealth, eqPct, debt, married]
  );

  const grossDivNeeded = grossUpDividend(d.totalTax);

  return (
    <div>
      <div className="calc-grid">
        <div>
          <SectionTitle>Formue og gjeld</SectionTitle>
          <WealthSlider label="Brutto formue" value={wealth} onChange={setWealth} />
          <Slider label="Aksjeandel (20 % rabatt)" value={eqPct} onChange={setEqPct} min={0} max={100} step={5} suffix=" %" decimals={0} />
          <WealthSlider
            label="Gjeld"
            value={debt}
            onChange={setDebt}
            max={Math.min(wealth, 500_000_000)}
            presets={[
              { label: "0 kr", val: 0 },
              { label: "5M", val: 5_000_000 },
              { label: "15M", val: 15_000_000 },
              { label: "30M", val: 30_000_000 }
            ]}
          />
          <div style={{ marginTop: 10 }}>
            <Toggle label="Ektepar (dobbelt bunnfradrag)" value={married} onChange={setMarried} />
          </div>
        </div>

        <div>
          <SectionTitle>Beregnet formuesskatt</SectionTitle>
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
            <div style={{ fontSize: 12.5, color: T.textSec, marginBottom: 3 }}>Årlig formuesskatt</div>
            <div style={{ fontSize: 34, fontWeight: 800, color: T.red }}>{fmtKr(d.totalTax)}</div>
            <div style={{ fontSize: 12, color: T.textSec, marginTop: 3 }}>
              Krever ca. {fmtCompact(grossDivNeeded)} i brutto utbytte fra AS (37,84 % skatt)
            </div>
          </div>

          <div className="stat-grid" style={{ marginBottom: 16 }}>
            <StatBox label="Skattepliktig formue" value={fmtCompact(d.netTaxable)} color={T.accent} />
            <StatBox label="Aksjerabatt (20 %)" value={fmtCompact(d.discountAmount)} color={T.green} />
            <StatBox label="Trinn 1 (1,0 %)" value={fmtKr(d.trinn1Tax)} color={T.orange} />
            <StatBox label="Trinn 2 (1,1 %)" value={fmtKr(d.trinn2Tax)} color={T.red} />
          </div>

          <div style={{ background: T.surfaceAlt, borderRadius: 12, border: `1px solid ${T.border}`, padding: 12 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  <th style={{ ...thS, textAlign: "left" }}>Post</th>
                  <th style={thS}>Beløp</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  <Td left sec>Bunnfradrag ({married ? "ektepar" : "enslig"})</Td>
                  <Td>{fmtKr(d.bunnfradrag)}</Td>
                </tr>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  <Td left sec>Fradragsberettiget gjeld (etter rabatt)</Td>
                  <Td>{fmtKr(d.deductibleDebt)}</Td>
                </tr>
                <tr>
                  <Td left bold>Effektiv formuesskattesats på formue</Td>
                  <Td bold color={T.red}>{fmtPct(wealth > 0 ? (d.totalTax / wealth) * 100 : 0, 2)}</Td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
