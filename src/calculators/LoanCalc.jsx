import { useState, useMemo } from "react";
import { TAX } from "../config/taxRates";
import { fmtCompact, fmtKr, fmtPct } from "../utils/format";
import { T, WealthSlider, Slider, StatBox, SectionTitle, ChartBox, SegmentedControl, InteractiveChart } from "../components/UI";

export default function LoanCalc() {
  const [la, setLa] = useState(10_000_000);
  const [ir, setIr] = useState(5.25);
  const [ly, setLy] = useState(25);
  const [ep, setEp] = useState(0);
  const [lt, setLt] = useState("annuitet");

  const r = useMemo(() => {
    const mr = ir / 100 / 12;
    const tm = ly * 12;
    let b = la;
    let ti = 0;
    let mp = 0;
    const cd = [la];

    if (lt === "annuitet") {
      mp = mr > 0 ? (la * (mr * Math.pow(1 + mr, tm))) / (Math.pow(1 + mr, tm) - 1) : la / tm;
      const eff = mp + ep;
      let m = 0;
      while (b > 0 && m < tm * 2) {
        const interest = b * mr;
        const principal = eff - interest;
        if (principal <= 0) break;
        b = Math.max(0, b - principal);
        ti += interest;
        m++;
        if (m % 12 === 0 || b === 0) cd.push(b);
      }
    } else {
      const mpr = la / tm;
      mp = mpr + la * mr;
      for (let m = 0; m < tm && b > 0; m++) {
        ti += b * mr;
        b = Math.max(0, b - mpr - ep);
        if ((m + 1) % 12 === 0 || b === 0) cd.push(b);
      }
    }

    const taxShield = ti * TAX.SKATT_ALM;
    const netInterest = ti - taxShield;
    const effAfterTaxRate = ir * (1 - TAX.SKATT_ALM);

    return { mp, ti, taxShield, netInterest, effAfterTaxRate, cd };
  }, [la, ir, ly, ep, lt]);

  return (
    <div>
      <div className="calc-grid">
        <div>
          <SectionTitle>Låneoppsett</SectionTitle>
          <SegmentedControl
            label="Type lån"
            options={[
              { value: "annuitet", label: "Annuitetslån" },
              { value: "serie", label: "Serielån" }
            ]}
            value={lt}
            onChange={setLt}
          />
          <WealthSlider
            label="Lånebeløp"
            value={la}
            onChange={setLa}
            max={250_000_000}
            presets={[
              { label: "5M", val: 5_000_000 },
              { label: "10M", val: 10_000_000 },
              { label: "25M", val: 25_000_000 },
              { label: "50M", val: 50_000_000 }
            ]}
          />
          <Slider label="Nominell rente" value={ir} onChange={setIr} min={1} max={10} step={0.05} suffix=" %" />
          <Slider label="Nedbetalingstid" value={ly} onChange={setLy} min={5} max={35} suffix=" år" decimals={0} />
          <Slider
            label="Ekstra avdrag per måned"
            value={ep}
            onChange={setEp}
            min={0}
            max={200_000}
            step={5_000}
            format={(v) => fmtKr(v)}
          />
        </div>

        <div>
          <SectionTitle>Termin og rentekostnad</SectionTitle>
          <div className="stat-grid" style={{ marginBottom: 16 }}>
            <StatBox label="Terminbeløp (1. mnd)" value={fmtKr(r.mp)} color={T.accent} />
            <StatBox label="Rente etter 22 % skattefradrag" value={fmtPct(r.effAfterTaxRate, 2)} color={T.green} />
            <StatBox label="Total rentekostnad" value={fmtCompact(r.ti)} color={T.red} />
            <StatBox
              label="Netto rente etter 22 %"
              value={fmtCompact(r.netInterest)}
              color={T.orange}
              sub={`Skattefradrag: ${fmtCompact(r.taxShield)}`}
            />
          </div>

          <ChartBox label="Nedbetaling av restgjeld">
            <InteractiveChart
              data={r.cd}
              color={T.accent}
              formatY={(v) => fmtCompact(v)}
              formatX={(i) => `År ${i}`}
              labels={["0 år", `${r.cd.length - 1} år`]}
            />
          </ChartBox>
        </div>
      </div>
    </div>
  );
}
