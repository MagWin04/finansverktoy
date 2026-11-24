import { useState, useMemo } from "react";
import { fmtPct } from "../utils/format";
import { T, Slider, StatBox, SectionTitle, SegmentedControl, ChartBox, MultiLineChart } from "../components/UI";

const MODELS = {
  cederburg: {
    name: "Cederburg-modellen (Høy aksjeandel + global spredning)",
    summary:
      "Basert på forskning (bl.a. Anarkulova, Cederburg & O'Doherty) som viser at langsiktige investorer og pensjonister historisk har oppnådd høyere sluttformue og færre fallgruver med en høy andel globalt diversifiserte aksjer fremfor tunge obligasjonsposisjoner.",
    eq: 95,
    bonds: 5,
    homeBias: 20,
    factorTilt: 15,
    er: 8.2,
    vol: 16.2
  },
  famaFrench: {
    name: "Fama-French Faktor-tilt (Størrelse & Verdi)",
    summary:
      "Inspirert av Fama og Frenchs trefaktor-/femfaktormodell: kombinerer bred markedsbeta med målrettet vekting mot mindre selskaper (Small Cap) og lavt prisede selskaper (Value) for å fange opp dokumenterte langsiktige risikopremier.",
    eq: 85,
    bonds: 15,
    homeBias: 15,
    factorTilt: 45,
    er: 8.6,
    vol: 16.8
  },
  classic6040: {
    name: "Klassisk 60/40 (Aksjer / Obligasjoner)",
    summary:
      "Tradisjonell balansert portefølje med 60 % aksjer og 40 % rentepapirer for lavere kortsiktig svingning, men historisk lavere langsiktig vekst og større risiko for inflasjonsutvanning over 25–30 år.",
    eq: 60,
    bonds: 40,
    homeBias: 20,
    factorTilt: 0,
    er: 6.4,
    vol: 10.5
  }
};

export default function EvidenceAllocation() {
  const [modelKey, setModelKey] = useState("cederburg");
  const [yrs, setYrs] = useState(25);
  const [extraFactor, setExtraFactor] = useState(20);

  const active = MODELS[modelKey];

  const sim = useMemo(() => {
    const tiltFactor = (extraFactor / 100) * 0.45; // forsiktig antatt faktorpremie i modellering
    const rCederburg = 1 + (MODELS.cederburg.er + tiltFactor * 0.4) / 100;
    const rFF = 1 + (MODELS.famaFrench.er + tiltFactor) / 100;
    const r6040 = 1 + MODELS.classic6040.er / 100;

    const sCed = [100];
    const sFF = [100];
    const s6040 = [100];

    for (let y = 1; y <= yrs; y++) {
      sCed.push(sCed[y - 1] * rCederburg);
      sFF.push(sFF[y - 1] * rFF);
      s6040.push(s6040[y - 1] * r6040);
    }

    const effEr = active.er + (modelKey === "famaFrench" ? tiltFactor : tiltFactor * 0.35);
    return { sCed, sFF, s6040, effEr };
  }, [yrs, extraFactor, active.er, modelKey]);

  return (
    <div>
      <div className="calc-grid">
        <div>
          <SectionTitle>Forskningsbaserte porteføljemodeller</SectionTitle>
          <SegmentedControl
            label="Velg forskningsretning"
            options={[
              { value: "cederburg", label: "Cederburg (Aksjefokus)" },
              { value: "famaFrench", label: "Fama-French (Faktor)" },
              { value: "classic6040", label: "Klassisk 60/40" }
            ]}
            value={modelKey}
            onChange={setModelKey}
            columns={3}
          />

          <div
            style={{
              padding: 14,
              borderRadius: 12,
              background: T.surfaceAlt,
              border: `1px solid ${T.border}`,
              marginBottom: 18
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 6 }}>{active.name}</div>
            <div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.6 }}>{active.summary}</div>
          </div>

          <Slider
            label="Faktorvekting (Small Cap / Value)"
            value={extraFactor}
            onChange={setExtraFactor}
            min={0}
            max={60}
            step={5}
            suffix=" %"
            decimals={0}
          />
          <Slider label="Sammenligningshorisont" value={yrs} onChange={setYrs} min={10} max={40} suffix=" år" decimals={0} />
        </div>

        <div>
          <SectionTitle>Nøkkeltall og langsiktig bane</SectionTitle>
          <div className="stat-grid" style={{ marginBottom: 16 }}>
            <StatBox label="Aksje / Renter" value={`${active.eq} % / ${active.bonds} %`} color={T.accent} />
            <StatBox label="Modellert avkastning" value={fmtPct(sim.effEr, 1)} color={T.green} sub="Før kostnader og skatt" />
            <StatBox label="Estimert volatilitet" value={`±${fmtPct(active.vol, 1)}`} color={T.orange} />
            <StatBox label={`Indeks 100 etter ${yrs} år`} value={`${Math.round(
              modelKey === "cederburg" ? sim.sCed[yrs] : modelKey === "famaFrench" ? sim.sFF[yrs] : sim.s6040[yrs]
            )}`} color={T.teal} />
          </div>

          <ChartBox label={`Relativ vekst (indeks = 100) over ${yrs} år`}>
            <MultiLineChart
              datasets={[
                { data: sim.sFF, color: T.teal, label: "Fama-French tilt" },
                { data: sim.sCed, color: T.green, label: "Cederburg (høy aksjeandel)" },
                { data: sim.s6040, color: T.orange, label: "Klassisk 60/40" }
              ]}
              labels={["0 år", `${yrs} år`]}
            />
          </ChartBox>
        </div>
      </div>

      <div className="info-banner">
        <strong>Rådgivningsnotat: </strong>
        Historisk forskning viser sterke langsiktige mønstre, men fremtidig avkastning er aldri garantert. I praksis må forskningen balanseres mot kundens faktiske risikoevne, likviditetsbehov og psykologiske tålegrense i urolige markeder.
      </div>
    </div>
  );
}
