import { useState } from "react";
import { T, SectionTitle } from "../components/UI";

const TIPS = [
  {
    tag: "AS & Eierskap",
    title: "Hold styr på innbetalt kapital (skattefritt uttak)",
    desc: "Innbetalt aksjekapital og overkurs i et AS kan i utgangspunktet tilbakebetales skattefritt til eier før skattepliktig utbytte (37,84 %) slår inn. Sørg for at dette er korrekt dokumentert i regnskapet."
  },
  {
    tag: "Lønn vs. Utbytte",
    title: "Vurder 7,1G for pensjon og 6G for sykepenger",
    desc: "Som eier med arbeidsinnsats i eget AS gir lønn opp til 7,1G pensjonsopptjening i folketrygden og sykepengegrunnlag opp til 6G. Over disse grensene bør man ofte vurdere om utbytte gir bedre totaløkonomi."
  },
  {
    tag: "Skjermingsfradrag",
    title: "Ubrukt skjerming ruller videre på ASK og aksjer",
    desc: "Skjermingsfradrag som ikke blir brukt opp et år, tas med videre til neste år. Ved uttak på ASK brukes kostpris og opparbeidet skjerming opp før gevinstskatten på 37,84 % starter."
  },
  {
    tag: "Årsskifte & Realisasjon",
    title: "Gjennomgå urealiserte tap og gevinster før årsskiftet",
    desc: "På ordinær VPS-konto eller i AS kan realisering av tap mot gevinst i samme inntektsår påvirke skatteoppgjøret. Vær oppmerksom på særregler for aksjer og tidspunkt for gjennomføring."
  },
  {
    tag: "Kontovalg",
    title: "ASK vs. Fondskonto vs. VPS",
    desc: "ASK passer for aksjer og aksjefond i EØS med utsatt skatt. Fondskonto gir utsatt skatt på tvers av aksje- og rentefond (80/20-regelen), mens VPS beskatter løpende ved salg/renteutbetaling."
  },
  {
    tag: "Formuesskatt",
    title: "20 % verdsettelsesrabatt på aksjer og gjeldsavkortning",
    desc: "Aksjer og aksjefond verdsettes med 20 % rabatt i formuesskatten (80 % formuesverdi), mens gjeld reduseres forholdsmessig. Skal formuesskatt dekkes fra AS med utbytte, må man ta høyde for 37,84 % utbytteskatt."
  }
];

export default function TaxTips() {
  const [filter, setFilter] = useState("Alle");
  const tags = ["Alle", ...Array.from(new Set(TIPS.map((t) => t.tag)))];
  const list = filter === "Alle" ? TIPS : TIPS.filter((t) => t.tag === filter);

  return (
    <div>
      <SectionTitle>Smart skatteplanlegging og rådgivningstips</SectionTitle>
      <div className="preset-row" style={{ marginBottom: 18 }}>
        {tags.map((tg) => (
          <button
            key={tg}
            type="button"
            onClick={() => setFilter(tg)}
            className={`preset-btn ${filter === tg ? "active" : ""}`}
          >
            {tg}
          </button>
        ))}
      </div>

      <div className="stat-grid">
        {list.map((tip) => (
          <div
            key={tip.title}
            style={{
              background: T.surfaceAlt,
              border: `1px solid ${T.border}`,
              borderRadius: 14,
              padding: 16
            }}
          >
            <div style={{ fontSize: 10.5, color: T.accent, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>
              {tip.tag}
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 6 }}>{tip.title}</div>
            <div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.6 }}>{tip.desc}</div>
          </div>
        ))}
      </div>

      <div className="info-banner">
        <strong>Viktig: </strong>
        Disse punktene er ment som samtalestøtte og huskeliste i rådgivning. Skatteregler og individuelle forhold krever alltid konkret vurdering.
      </div>
    </div>
  );
}
