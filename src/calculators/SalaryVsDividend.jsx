import { useState, useMemo } from "react";
import { TAX, calcTrinnskatt, grossUpDividend } from "../config/taxRates";
import { fmtCompact, fmtKr, fmtPct } from "../utils/format";
import { T, Slider, StatBox, SectionTitle, ChartBox, InteractiveChart } from "../components/UI";

export default function SalaryVsDividend() {
  const [budget, setBudget] = useState(1_500_000); // Totalt tilgjengelig i selskapet før AGA og skatt
  const [salary, setSalary] = useState(750_000);  // Brutto lønn til eier
  const [agaRate, setAgaRate] = useState(14.1);

  const g = TAX.G_BELOP;
  const cap6G = 6 * g;
  const cap71G = 7.1 * g;

  const calc = useMemo(() => {
    const agaFactor = 1 + agaRate / 100;
    // Maks mulig bruttolønn gitt totalbudsjett i selskapet
    const maxSalary = Math.max(0, Math.min(budget / agaFactor, 3_000_000));
    const s = Math.min(salary, maxSalary);

    const agaCost = s * (agaRate / 100);
    const totalSalaryCost = s + agaCost;

    // Personlig skatt på lønn (forenklet minstefradrag + personfradrag)
    const minFradrag = Math.min(s * 0.46, 92000);
    const personFradrag = 88250;
    const alminneligInntekt = Math.max(0, s - minFradrag - personFradrag);
    const trygdeavgift = s * TAX.TRYGDEAVGIFT_LONN;
    const trinnskatt = calcTrinnskatt(s);
    const almSkatt = alminneligInntekt * TAX.SKATT_ALM;
    const personalSalaryTax = trygdeavgift + trinnskatt + almSkatt;
    const netSalary = Math.max(0, s - personalSalaryTax);

    // Rest i selskapet etter lønn og AGA -> betaler 22 % selskapsskatt -> kan deles ut som utbytte
    const remainingBeforeCorpTax = Math.max(0, budget - totalSalaryCost);
    const corpTax = remainingBeforeCorpTax * TAX.SELSKAPSSKATT;
    const distributable = Math.max(0, remainingBeforeCorpTax - corpTax);
    const netDividend = distributable * (1 - TAX.EFF_AKSJE_SKATT);
    const dividendTax = distributable - netDividend;

    const totalNetPrivate = netSalary + netDividend;
    const totalTaxAll = personalSalaryTax + corpTax + dividendTax;
    const effTotalTaxRate = budget > 0 ? (totalTaxAll / budget) * 100 : 0;

    // Finn optimal bruttolønn for gitt budsjett
    let bestSalary = 0;
    let bestNet = -1;
    const curve = [];
    const steps = 40;
    for (let i = 0; i <= steps; i++) {
      const testS = (maxSalary * i) / steps;
      const testAga = testS * (agaRate / 100);
      const tMf = Math.min(testS * 0.46, 92000);
      const tAlm = Math.max(0, testS - tMf - 88250) * TAX.SKATT_ALM;
      const tTrygd = testS * TAX.TRYGDEAVGIFT_LONN;
      const tTrinn = calcTrinnskatt(testS);
      const netS = Math.max(0, testS - (tAlm + tTrygd + tTrinn));

      const rem = Math.max(0, budget - testS - testAga);
      const dist = rem * (1 - TAX.SELSKAPSSKATT);
      const netD = dist * (1 - TAX.EFF_AKSJE_SKATT);
      const totN = netS + netD;
      curve.push(totN);
      if (totN > bestNet) {
        bestNet = totN;
        bestSalary = testS;
      }
    }

    return {
      maxSalary,
      s,
      agaCost,
      netSalary,
      personalSalaryTax,
      corpTax,
      distributable,
      dividendTax,
      netDividend,
      totalNetPrivate,
      totalTaxAll,
      effTotalTaxRate,
      bestSalary,
      bestNet,
      curve
    };
  }, [budget, salary, agaRate]);

  return (
    <div>
      <div className="calc-grid">
        <div>
          <SectionTitle>Selskap og uttak</SectionTitle>
          <Slider
            label="Tilgjengelig i selskapet (før AGA og skatt)"
            value={budget}
            onChange={(v) => {
              setBudget(v);
              const maxS = Math.min(v / (1 + agaRate / 100), 3_000_000);
              if (salary > maxS) setSalary(Math.round(maxS));
            }}
            min={200_000}
            max={10_000_000}
            step={50_000}
            format={(v) => fmtCompact(v)}
          />
          <Slider
            label="Valgt bruttolønn til deg"
            value={Math.min(salary, calc.maxSalary)}
            onChange={setSalary}
            min={0}
            max={Math.max(100_000, Math.round(calc.maxSalary))}
            step={10_000}
            format={(v) => fmtKr(v)}
          />
          <Slider
            label="Arbeidsgiveravgift (AGA-sone)"
            value={agaRate}
            onChange={setAgaRate}
            min={0}
            max={14.1}
            step={0.1}
            suffix=" %"
          />

          <div className="info-banner" style={{ marginTop: 12 }}>
            <strong>Viktige grenser i folketrygden (G ≈ {fmtKr(g)}): </strong>
            Sykepengegrunnlag begrenses oppad til <strong>6G ({fmtKr(cap6G)})</strong>, og pensjonsopptjening i folketrygden stopper på <strong>7,1G ({fmtKr(cap71G)})</strong>. Over dette gir lønn ingen ekstra trygderettigheter, men påløper arbeidsgiveravgift og trinnskatt.
          </div>
        </div>

        <div>
          <SectionTitle>Netto utbetaling privat</SectionTitle>
          <div
            style={{
              background: T.greenGlow,
              border: "1px solid rgba(48,209,88,0.2)",
              borderRadius: 16,
              padding: 18,
              marginBottom: 16,
              textAlign: "center"
            }}
          >
            <div style={{ fontSize: 12.5, color: T.textSec, marginBottom: 3 }}>Samlet netto privat (lønn + utbytte)</div>
            <div style={{ fontSize: 34, fontWeight: 800, color: T.green }}>{fmtKr(calc.totalNetPrivate)}</div>
            <div style={{ fontSize: 12, color: T.textSec, marginTop: 3 }}>
              Effektiv total skatt: {fmtPct(calc.effTotalTaxRate, 1)} · Modellert sweet spot lønn: ca. {fmtKr(calc.bestSalary)}
            </div>
          </div>

          <div className="stat-grid" style={{ marginBottom: 16 }}>
            <StatBox
              label="Netto lønn på konto"
              value={fmtKr(calc.netSalary)}
              color={T.accent}
              sub={`Brutto lønn: ${fmtKr(calc.s)} · AGA: ${fmtKr(calc.agaCost)}`}
            />
            <StatBox
              label="Netto utbytte på konto"
              value={fmtKr(calc.netDividend)}
              color={T.teal}
              sub={`Etter 22 % selskapsskatt & 37,84 % utbytteskatt`}
            />
            <StatBox
              label="Skatt på lønn & AGA"
              value={fmtCompact(calc.personalSalaryTax + calc.agaCost)}
              color={T.orange}
              sub={`Personskatt: ${fmtCompact(calc.personalSalaryTax)}`}
            />
            <StatBox
              label="Selskaps- & utbytteskatt"
              value={fmtCompact(calc.corpTax + calc.dividendTax)}
              color={T.red}
              sub={`Selskap: ${fmtCompact(calc.corpTax)} · Utbytte: ${fmtCompact(calc.dividendTax)}`}
            />
          </div>

          <ChartBox label="Netto privat utbetaling langs lønnsskalaen (0 kr til maks lønn)">
            <InteractiveChart
              data={calc.curve}
              color={T.green}
              formatY={(v) => fmtKr(v)}
              formatX={(i) => `Lønn ca. ${fmtCompact((calc.maxSalary * i) / 40)}`}
              labels={["0 kr lønn", `Maks lønn (${fmtCompact(calc.maxSalary)})`]}
            />
          </ChartBox>
        </div>
      </div>
    </div>
  );
}
