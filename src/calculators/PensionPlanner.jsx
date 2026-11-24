import { useState, useMemo } from "react";
import { fmtCompact, fmtPct, seededRandom, boxMuller } from "../utils/format";
import { T, WealthSlider, Slider, Toggle, StatBox, SectionTitle, ChartBox, InteractiveChart, MCChart } from "../components/UI";

export default function PensionPlanner() {
  const [port, setPort] = useState(40_000_000);
  const [annualDraw, setAnnualDraw] = useState(1_600_000);
  const [otherPension, setOtherPension] = useState(300_000); // Folketrygd / tjenestepensjon per år
  const [ret, setRet] = useState(6.2);
  const [vol, setVol] = useState(11.0);
  const [infl, setInfl] = useState(2.5);
  const [startAge, setStartAge] = useState(62);
  const [showMC, setShowMC] = useState(true);

  const res = useMemo(() => {
    const maxY = Math.min(45, Math.max(10, 100 - startAge));
    const netPortDraw = Math.max(0, annualDraw - otherPension);

    const runPath = (customRets = null) => {
      let b = port;
      let wd = netPortDraw;
      let depAge = null;
      const s = [b];
      for (let y = 1; y <= maxY; y++) {
        const r = customRets ? customRets[y - 1] : ret / 100;
        b = b * (1 + r) - wd;
        if (b <= 0) {
          b = 0;
          if (!depAge) depAge = startAge + y;
        }
        s.push(b);
        wd *= 1 + infl / 100;
      }
      return { s, depAge, end: s[s.length - 1] };
    };

    const det = runPath(null);
    const pData = { p10: [], p25: [], p50: [], p75: [], p90: [] };
    let surv = null;

    if (showMC) {
      const N = 400;
      const allB = Array.from({ length: maxY + 1 }, () => []);
      const ends = [];
      for (let i = 0; i < N; i++) {
        const rng = seededRandom(77 + i * 7919);
        const rets = Array.from({ length: maxY }, () => ret / 100 + (vol / 100) * boxMuller(rng));
        const sim = runPath(rets);
        for (let y = 0; y <= maxY; y++) allB[y].push(sim.s[y]);
        ends.push(sim.end);
      }
      for (let y = 0; y <= maxY; y++) {
        const sorted = allB[y].slice().sort((a, b) => a - b);
        const p = (q) => sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))];
        pData.p10.push(p(0.1));
        pData.p25.push(p(0.25));
        pData.p50.push(p(0.5));
        pData.p75.push(p(0.75));
        pData.p90.push(p(0.9));
      }
      surv = (ends.filter((v) => v > 0).length / N) * 100;
    }

    return { det, pData, surv, maxY, netPortDraw };
  }, [port, annualDraw, otherPension, ret, vol, infl, startAge, showMC]);

  const drawRate = port > 0 ? (res.netPortDraw / port) * 100 : 0;

  return (
    <div>
      <div className="calc-grid">
        <div>
          <SectionTitle>Pensjon og uttak</SectionTitle>
          <WealthSlider label="Pensjons- og investeringsportefølje" value={port} onChange={setPort} />
          <Slider
            label="Ønsket årlig pensjonsuttak totalt"
            value={annualDraw}
            onChange={setAnnualDraw}
            min={200_000}
            max={12_000_000}
            step={100_000}
            format={(v) => fmtCompact(v)}
          />
          <Slider
            label="Annen pensjon (folketrygd / AFP / tjeneste)"
            value={otherPension}
            onChange={setOtherPension}
            min={0}
            max={2_000_000}
            step={50_000}
            format={(v) => fmtCompact(v)}
          />
          <Slider label="Forventet årlig avkastning" value={ret} onChange={setRet} min={1} max={12} step={0.2} suffix=" %" />
          <Slider label="Svingninger / volatilitet" value={vol} onChange={setVol} min={2} max={22} step={0.5} suffix=" %" />
          <Slider label="Inflasjon" value={infl} onChange={setInfl} min={0} max={6} step={0.25} suffix=" %" />
          <Slider label="Uttaksalder start" value={startAge} onChange={setStartAge} min={50} max={80} suffix=" år" decimals={0} />
          <div style={{ marginTop: 10 }}>
            <Toggle label="Vis Monte Carlo-spenn (400 simuleringer)" value={showMC} onChange={setShowMC} />
          </div>
        </div>

        <div>
          <SectionTitle>Hvor lenge varer porteføljen?</SectionTitle>
          <div
            style={{
              background: res.det.depAge ? T.redGlow : T.greenGlow,
              border: `1px solid ${res.det.depAge ? "rgba(255,69,58,0.2)" : "rgba(48,209,88,0.2)"}`,
              borderRadius: 16,
              padding: 18,
              marginBottom: 16,
              textAlign: "center"
            }}
          >
            <div style={{ fontSize: 12.5, color: T.textSec, marginBottom: 3 }}>Porteføljen rekker til</div>
            <div style={{ fontSize: 34, fontWeight: 800, color: res.det.depAge ? T.red : T.green }}>
              {res.det.depAge ? `${res.det.depAge} år` : "100+ år"}
            </div>
            <div style={{ fontSize: 12, color: T.textSec, marginTop: 3 }}>
              Uttak fra portefølje første år: {fmtCompact(res.netPortDraw)} ({fmtPct(drawRate, 2)})
            </div>
          </div>

          <div className="stat-grid" style={{ marginBottom: 16 }}>
            <StatBox label="Uttaksrate fra portefølje" value={fmtPct(drawRate, 2)} color={drawRate <= 4 ? T.green : T.orange} />
            {showMC && res.surv !== null ? (
              <StatBox
                label="Overlevelsesrate"
                value={fmtPct(res.surv, 0)}
                color={res.surv >= 85 ? T.green : res.surv >= 65 ? T.orange : T.red}
                sub={`Til ${startAge + res.maxY} år`}
              />
            ) : (
              <StatBox label="Sluttverdi ved horisont" value={fmtCompact(res.det.end)} color={T.accent} />
            )}
          </div>

          {showMC ? (
            <ChartBox label={`Utfallsrom (${startAge} til ${startAge + res.maxY} år)`}>
              <MCChart data={res.pData} det={res.det.s} />
              <div style={{ display: "flex", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
                {[
                  { l: "Forventet bane", c: T.text },
                  { l: "Median (P50)", c: T.accent },
                  { l: "P25 til P75", c: "rgba(41,151,255,0.35)" },
                  { l: "P10 til P90", c: "rgba(41,151,255,0.14)" }
                ].map((x) => (
                  <div key={x.l} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ width: 10, height: 4, borderRadius: 2, background: x.c }} />
                    <span style={{ fontSize: 10.5, color: T.textTer }}>{x.l}</span>
                  </div>
                ))}
              </div>
            </ChartBox>
          ) : (
            <ChartBox label="Porteføljeverdi i pensjonstiden">
              <InteractiveChart
                data={res.det.s}
                color={res.det.depAge ? T.red : T.green}
                formatY={(v) => fmtCompact(v)}
                formatX={(i) => `${startAge + i} år`}
                labels={[`${startAge} år`, `${startAge + res.maxY} år`]}
              />
            </ChartBox>
          )}
        </div>
      </div>
    </div>
  );
}
