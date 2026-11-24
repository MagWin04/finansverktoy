import { useState, useMemo } from "react";
import { TAX } from "../config/taxRates";
import { fmtCompact, fmtPct } from "../utils/format";
import { T, WealthSlider, Slider, StatBox, SectionTitle, ChartBox, MultiLineChart } from "../components/UI";

export default function DebtVsInvest() {
  const [amount, setAmount] = useState(10_000_000);
  const [loanRate, setLoanRate] = useState(5.25);
  const [invRate, setInvRate] = useState(7.5);
  const [yrs, setYrs] = useState(15);
  const [invTaxRate, setInvTaxRate] = useState(37.84);

  const res = useMemo(() => {
    const netLoanRate = loanRate * (1 - TAX.SKATT_ALM);
    const netInvRate = invRate * (1 - invTaxRate / 100);

    let invVal = amount;
    let debtSavedCum = 0;
    const invSeries = [invVal];
    const debtBenefitSeries = [0];

    for (let y = 1; y <= yrs; y++) {
      invVal = invVal * (1 + invRate / 100);
      debtSavedCum = amount * (Math.pow(1 + netLoanRate / 100, y) - 1);
      invSeries.push(invVal);
      debtBenefitSeries.push(debtSavedCum);
    }

    const invGain = Math.max(0, invVal - amount);
    const invAfterTax = invVal - invGain * (invTaxRate / 100);
    const netAdvantageInvest = invAfterTax - (amount + debtSavedCum);

    // Break-even nominell avkastning før skatt
    const breakEvenGrossRate = netLoanRate / (1 - invTaxRate / 100);

    return {
      netLoanRate,
      netInvRate,
      invAfterTax,
      debtSavedCum,
      netAdvantageInvest,
      breakEvenGrossRate,
      invSeries,
      debtBenefitSeries
    };
  }, [amount, loanRate, invRate, yrs, invTaxRate]);

  return (
    <div>
      <div className="calc-grid">
        <div>
          <SectionTitle>Nedbetale gjeld eller investere?</SectionTitle>
          <WealthSlider label="Tilgjengelig kapital" value={amount} onChange={setAmount} />
          <Slider label="Nominell lånerente" value={loanRate} onChange={setLoanRate} min={1} max={10} step={0.1} suffix=" %" />
          <Slider label="Forventet avkastning i markedet" value={invRate} onChange={setInvRate} min={1} max={14} step={0.25} suffix=" %" />
          <Slider label="Skatt på investeringsgevinst" value={invTaxRate} onChange={setInvTaxRate} min={0} max={37.84} step={0.01} suffix=" %" />
          <Slider label="Tidshorisont" value={yrs} onChange={setYrs} min={3} max={35} suffix=" år" decimals={0} />
        </div>

        <div>
          <SectionTitle>Sammenligning etter {yrs} år</SectionTitle>
          <div
            style={{
              background: res.netAdvantageInvest >= 0 ? T.greenGlow : T.accentGlow,
              border: `1px solid ${res.netAdvantageInvest >= 0 ? "rgba(48,209,88,0.22)" : "rgba(41,151,255,0.22)"}`,
              borderRadius: 16,
              padding: 18,
              marginBottom: 16,
              textAlign: "center"
            }}
          >
            <div style={{ fontSize: 12.5, color: T.textSec, marginBottom: 3 }}>
              {res.netAdvantageInvest >= 0 ? "Investere gir mest igjen" : "Nedbetale gjeld gir mest igjen"}
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color: res.netAdvantageInvest >= 0 ? T.green : T.accent }}>
              {fmtCompact(Math.abs(res.netAdvantageInvest))}
            </div>
            <div style={{ fontSize: 11.5, color: T.textSec, marginTop: 3 }}>
              Break-even avkastning før skatt: {fmtPct(res.breakEvenGrossRate, 2)}
            </div>
          </div>

          <div className="stat-grid" style={{ marginBottom: 16 }}>
            <StatBox label="Netto lånerente (etter 22 %)" value={fmtPct(res.netLoanRate, 2)} color={T.red} />
            <StatBox label="Investering etter skatt" value={fmtCompact(res.invAfterTax)} color={T.green} />
            <StatBox label="Spart rentekostnad (etter 22 %)" value={fmtCompact(res.debtSavedCum)} color={T.accent} />
            <StatBox label="Break-even før skatt" value={fmtPct(res.breakEvenGrossRate, 2)} color={T.teal} />
          </div>

          <ChartBox label="Sammenligning over tid">
            <MultiLineChart
              datasets={[
                { data: res.invSeries, color: T.green, label: "Investert verdi (før uttaksskatt)" },
                { data: res.debtBenefitSeries.map((v) => amount + v), color: T.accent, label: "Kapital + spart nettorente" }
              ]}
              labels={["0 år", `${yrs} år`]}
            />
          </ChartBox>
        </div>
      </div>
    </div>
  );
}
