import { useState, useMemo } from "react";
import { TAX, calcWealthTax } from "../config/taxRates";
import { fmtCompact, fmtKr } from "../utils/format";
import { T, WealthSlider, Slider, Toggle, StatBox, SectionTitle, ChartBox, MultiLineChart } from "../components/UI";

export default function HoldingVsPrivate() {
  const [capital, setCapital] = useState(25_000_000);
  const [yrs, setYrs] = useState(20);
  const [eqRet, setEqRet] = useState(8.0);
  const [asCost, setAsCost] = useState(30_000);
  const [includeWT, setIncludeWT] = useState(true);
  const [married, setMarried] = useState(false);

  const res = useMemo(() => {
    let askVal = capital;
    let askCb = capital;
    let askSkj = 0;

    let asVal = capital;
    let asCb = capital;
    let asSkj = 0;

    const askSeries = [askVal];
    const asSeries = [asVal];

    for (let y = 1; y <= yrs; y++) {
      askSkj += askCb * TAX.SKJERMINGSRENTE;
      askVal = askVal * (1 + eqRet / 100);
      if (includeWT && askVal > 0) {
        const wt = calcWealthTax({ totalWealth: askVal, equityShare: 1, married });
        askVal = Math.max(0, askVal - wt);
      }
      askSeries.push(askVal);

      asSkj += asCb * TAX.SKJERMINGSRENTE;
      asVal = asVal * (1 + eqRet / 100) - asCost;
      if (includeWT && asVal > 0) {
        const wt = calcWealthTax({ totalWealth: asVal, equityShare: 1, married });
        // Utbytte fra AS for å dekke formuesskatt etter innbetalt kapital og skjerming
        const freeFromCb = Math.min(wt, asCb);
        asCb -= freeFromCb;
        let rem = wt - freeFromCb;
        const freeFromSkj = Math.min(rem, asSkj);
        asSkj -= freeFromSkj;
        rem -= freeFromSkj;
        const grossOut = freeFromCb + freeFromSkj + (rem > 0 ? rem / (1 - TAX.EFF_AKSJE_SKATT) : 0);
        asVal = Math.max(0, asVal - grossOut);
      }
      asSeries.push(asVal);
    }

    const askGain = Math.max(0, askVal - askCb);
    const askNetOut = askVal - Math.max(0, askGain - askSkj) * TAX.EFF_AKSJE_SKATT;

    const asGain = Math.max(0, asVal - asCb);
    const asNetOut = asVal - Math.max(0, asGain - asSkj) * TAX.EFF_AKSJE_SKATT;

    return {
      askVal,
      askNetOut,
      asVal,
      asNetOut,
      askSeries,
      asSeries,
      netDiff: asNetOut - askNetOut
    };
  }, [capital, yrs, eqRet, asCost, includeWT, married]);

  return (
    <div>
      <div className="calc-grid">
        <div>
          <SectionTitle>Skal jeg opprette AS eller ha det privat (ASK)?</SectionTitle>
          <WealthSlider label="Investerbar kapital" value={capital} onChange={setCapital} />
          <Slider label="Tidshorisont" value={yrs} onChange={setYrs} min={5} max={40} suffix=" år" decimals={0} />
          <Slider label="Forventet årlig aksjeavkastning" value={eqRet} onChange={setEqRet} min={2} max={14} step={0.25} suffix=" %" />
          <Slider
            label="Årlig kostnad til regnskap og revisjon i AS"
            value={asCost}
            onChange={setAsCost}
            min={0}
            max={120_000}
            step={5_000}
            format={(v) => fmtKr(v)}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
            <Toggle label="Inkluder formuesskatt" value={includeWT} onChange={setIncludeWT} />
            {includeWT && <Toggle label="Ektepar" value={married} onChange={setMarried} />}
          </div>
        </div>

        <div>
          <SectionTitle>Sammenligning etter {yrs} år</SectionTitle>
          <div
            style={{
              background: res.netDiff >= 0 ? T.accentGlow : T.greenGlow,
              border: `1px solid ${res.netDiff >= 0 ? "rgba(41,151,255,0.22)" : "rgba(48,209,88,0.22)"}`,
              borderRadius: 16,
              padding: 18,
              marginBottom: 16,
              textAlign: "center"
            }}
          >
            <div style={{ fontSize: 12.5, color: T.textSec, marginBottom: 3 }}>
              {res.netDiff >= 0 ? "Holding-AS gir høyest netto etter uttak" : "Privat ASK gir høyest netto etter uttak"}
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color: res.netDiff >= 0 ? T.accent : T.green }}>
              {fmtCompact(Math.abs(res.netDiff))}
            </div>
            <div style={{ fontSize: 11.5, color: T.textSec, marginTop: 3 }}>Netto forskjell etter 37,84 % skatt på gevinst/utbytte</div>
          </div>

          <div className="stat-grid" style={{ marginBottom: 16 }}>
            <StatBox
              label="Holding-AS (verdi inne)"
              value={fmtCompact(res.asVal)}
              color={T.accent}
              sub={`Netto utbetalt privat: ${fmtCompact(res.asNetOut)}`}
            />
            <StatBox
              label="Privat ASK (verdi inne)"
              value={fmtCompact(res.askVal)}
              color={T.green}
              sub={`Netto utbetalt privat: ${fmtCompact(res.askNetOut)}`}
            />
          </div>

          <ChartBox label="Formuesutvikling over tid">
            <MultiLineChart
              datasets={[
                { data: res.asSeries, color: T.accent, label: "Holding-AS" },
                { data: res.askSeries, color: T.green, label: "Privat ASK" }
              ]}
              labels={["0 år", `${yrs} år`]}
            />
          </ChartBox>
        </div>
      </div>

      <div className="info-banner">
        <strong>Når lønner AS seg i praksis? </strong>
        Selv når regnestykket ser nokså likt ut på rene aksjefond, velger mange AS for å kunne investere i unoterte selskaper/eiendom/fond utenfor EØS, ta imot skattefrie utbytter fra driftsselskaper under fritaksmetoden, eller fordele aksjer/generasjonsskifte enklere.
      </div>
    </div>
  );
}
