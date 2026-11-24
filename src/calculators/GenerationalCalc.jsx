import { useState, useMemo } from "react";
import { TAX, calcWealthTax } from "../config/taxRates";
import { fmtCompact } from "../utils/format";
import { T, WealthSlider, Slider, StatBox, SectionTitle, ChartBox, MultiLineChart } from "../components/UI";

export default function GenerationalCalc() {
  const [wealth, setWealth] = useState(80_000_000);
  const [transferNow, setTransferNow] = useState(30_000_000);
  const [childrenCount, setChildrenCount] = useState(2);
  const [ret, setRet] = useState(7.0);
  const [yrs, setYrs] = useState(20);

  const res = useMemo(() => {
    const keepNow = Math.max(0, wealth - transferNow);
    const parentMarried = false;
    const childMarried = false;

    let pOnly = wealth;
    let pSplit = keepNow;
    let cSplit = transferNow;

    let wtOnlyCum = 0;
    let wtSplitCum = 0;

    const onlySeries = [pOnly];
    const splitSeries = [pSplit + cSplit];

    for (let y = 1; y <= yrs; y++) {
      const wt1 = calcWealthTax({ totalWealth: pOnly, equityShare: 0.8, married: parentMarried });
      wtOnlyCum += wt1;
      pOnly = Math.max(0, pOnly * (1 + ret / 100) - wt1);

      const wtParent = calcWealthTax({ totalWealth: pSplit, equityShare: 0.8, married: parentMarried });
      const perChild = cSplit / Math.max(1, childrenCount);
      const wtChildEach = calcWealthTax({ totalWealth: perChild, equityShare: 0.8, married: childMarried });
      const wtChildrenTotal = wtChildEach * Math.max(1, childrenCount);

      wtSplitCum += wtParent + wtChildrenTotal;
      pSplit = Math.max(0, pSplit * (1 + ret / 100) - wtParent);
      cSplit = Math.max(0, cSplit * (1 + ret / 100) - wtChildrenTotal);

      onlySeries.push(pOnly);
      splitSeries.push(pSplit + cSplit);
    }

    return {
      wtOnlyCum,
      wtSplitCum,
      savedWealthTax: Math.max(0, wtOnlyCum - wtSplitCum),
      endOnly: pOnly,
      endSplit: pSplit + cSplit,
      onlySeries,
      splitSeries
    };
  }, [wealth, transferNow, childrenCount, ret, yrs]);

  return (
    <div>
      <div className="calc-grid">
        <div>
          <SectionTitle>Generasjonsskifte og formuesskatt</SectionTitle>
          <WealthSlider label="Samlet familieformue" value={wealth} onChange={setWealth} />
          <WealthSlider
            label="Overføres / gis som forskudd nå"
            value={transferNow}
            onChange={setTransferNow}
            max={wealth}
            presets={[
              { label: "0 kr", val: 0 },
              { label: "10M", val: Math.min(wealth, 10_000_000) },
              { label: "25M", val: Math.min(wealth, 25_000_000) },
              { label: "50M", val: Math.min(wealth, 50_000_000) }
            ]}
          />
          <Slider label="Antall mottakere (barn)" value={childrenCount} onChange={setChildrenCount} min={1} max={5} suffix="" decimals={0} />
          <Slider label="Forventet avkastning" value={ret} onChange={setRet} min={2} max={12} step={0.25} suffix=" %" />
          <Slider label="Tidshorisont" value={yrs} onChange={setYrs} min={5} max={35} suffix=" år" decimals={0} />
        </div>

        <div>
          <SectionTitle>Effekt over {yrs} år</SectionTitle>
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
            <div style={{ fontSize: 12.5, color: T.textSec, marginBottom: 3 }}>Estimert spart formuesskatt for familien</div>
            <div style={{ fontSize: 34, fontWeight: 800, color: T.green }}>{fmtCompact(res.savedWealthTax)}</div>
            <div style={{ fontSize: 12, color: T.textSec, marginTop: 3 }}>
              Ved å fordele formue på flere bunnfradrag og lavere skattetrinn
            </div>
          </div>

          <div className="stat-grid" style={{ marginBottom: 16 }}>
            <StatBox label="Samlet formue ved fordeling" value={fmtCompact(res.endSplit)} color={T.green} />
            <StatBox label="Samlet formue udelt" value={fmtCompact(res.endOnly)} color={T.accent} />
            <StatBox label="Formuesskatt (fordelt)" value={fmtCompact(res.wtSplitCum)} color={T.teal} />
            <StatBox label="Formuesskatt (udelt)" value={fmtCompact(res.wtOnlyCum)} color={T.red} />
          </div>

          <ChartBox label="Samlet familieformue over tid">
            <MultiLineChart
              datasets={[
                { data: res.splitSeries, color: T.green, label: "Med overføring nå" },
                { data: res.onlySeries, color: T.accent, label: "Uten overføring" }
              ]}
              labels={["0 år", `${yrs} år`]}
            />
          </ChartBox>
        </div>
      </div>

      <div className="info-banner">
        <strong>Merk om kontinuitet: </strong>
        I Norge er det ikke arveavgift, men gaver og arv følger kontinuitetsprinsippet (mottaker overtar giverens inngangsverdi og skjermingsgrunnlag). Overføring av aksjer eller B-aksjer i et AS bør alltid vurderes sammen med skatterådgiver og vedtekter.
      </div>
    </div>
  );
}
