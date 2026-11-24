import { useState, useEffect } from "react";
import { TAX } from "./config/taxRates";
import { T, Card } from "./components/UI";
import SalaryVsDividend from "./calculators/SalaryVsDividend";
import HoldingVsPrivate from "./calculators/HoldingVsPrivate";
import WealthTaxCalc from "./calculators/WealthTaxCalc";
import PensionPlanner from "./calculators/PensionPlanner";
import DebtVsInvest from "./calculators/DebtVsInvest";
import GenerationalCalc from "./calculators/GenerationalCalc";
import EvidenceAllocation from "./calculators/EvidenceAllocation";
import FeeImpact from "./calculators/FeeImpact";
import CompoundCalc from "./calculators/CompoundCalc";
import LoanCalc from "./calculators/LoanCalc";
import TaxTips from "./calculators/TaxTips";

const CATEGORIES = [
  {
    id: "company",
    label: "Selskap & Skatt",
    tools: [
      { id: "salary", label: "Lønn vs. Utbytte" },
      { id: "holding", label: "AS vs. Privat" },
      { id: "wealthtax", label: "Formuesskatt" }
    ]
  },
  {
    id: "planning",
    label: "Pensjon & Planlegging",
    tools: [
      { id: "pension", label: "Pensjon & Uttak" },
      { id: "debtinv", label: "Lån vs. Investere" },
      { id: "gen", label: "Generasjonsskifte" }
    ]
  },
  {
    id: "research",
    label: "Investering & Forskning",
    tools: [
      { id: "alloc", label: "Allokering (Forskning)" },
      { id: "fees", label: "Kostnadseffekt" }
    ]
  },
  {
    id: "basics",
    label: "Grunnverktøy & Tips",
    tools: [
      { id: "compound", label: "Rentes rente" },
      { id: "loan", label: "Lånekalkulator" },
      { id: "tips", label: "Skattetips" }
    ]
  }
];

function getInitialFromHash() {
  try {
    const h = window.location.hash || "";
    const match = h.match(/tool=([a-z0-9]+)/i);
    if (!match) return { cat: "company", tool: "salary" };
    const toolId = match[1];
    for (const c of CATEGORIES) {
      if (c.tools.some((t) => t.id === toolId)) {
        return { cat: c.id, tool: toolId };
      }
    }
  } catch {
    // ignore
  }
  return { cat: "company", tool: "salary" };
}

export default function App() {
  const initial = getInitialFromHash();
  const [activeCat, setActiveCat] = useState(initial.cat);
  const [activeTool, setActiveTool] = useState(initial.tool);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    window.location.hash = `tool=${activeTool}`;
  }, [activeTool]);

  const currentCatObj = CATEGORIES.find((c) => c.id === activeCat) || CATEGORIES[0];

  const handleSelectCat = (catId) => {
    setActiveCat(catId);
    const found = CATEGORIES.find((c) => c.id === catId);
    if (found && found.tools.length > 0) {
      setActiveTool(found.tools[0].id);
    }
  };

  const handleShareLink = () => {
    const url = window.location.href;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const renderTool = () => {
    switch (activeTool) {
      case "salary":
        return <SalaryVsDividend />;
      case "holding":
        return <HoldingVsPrivate />;
      case "wealthtax":
        return <WealthTaxCalc />;
      case "pension":
        return <PensionPlanner />;
      case "debtinv":
        return <DebtVsInvest />;
      case "gen":
        return <GenerationalCalc />;
      case "alloc":
        return <EvidenceAllocation />;
      case "fees":
        return <FeeImpact />;
      case "compound":
        return <CompoundCalc />;
      case "loan":
        return <LoanCalc />;
      case "tips":
        return <TaxTips />;
      default:
        return <SalaryVsDividend />;
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.text }}>
      <div className="app-container" style={{ paddingTop: 28 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            flexWrap: "wrap",
            gap: 14,
            marginBottom: 20
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
              <h1
                style={{
                  fontSize: 30,
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                  background: "linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.6) 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent"
                }}
              >
                Finansverktøy
              </h1>
              <span style={{ fontSize: 11, color: T.accent, letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 700 }}>
                Rådgivning v3
              </span>
            </div>
            <p style={{ fontSize: 13.5, color: T.textSec }}>
              Kalkulatorer og planleggingsverktøy for kunder og rådgivere i Norge
            </p>
          </div>

          <div className="no-print" style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, color: T.textTer, marginRight: 4 }}>{TAX.SATSER_TEKST}</span>
            <button type="button" onClick={handleShareLink} className="action-btn">
              {copied ? "Lenke kopiert" : "Del verktøylenke"}
            </button>
            <button type="button" onClick={handlePrint} className="action-btn">
              Skriv ut / PDF
            </button>
          </div>
        </div>

        <div className="category-bar no-print">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => handleSelectCat(c.id)}
              className={`category-btn ${activeCat === c.id ? "active" : ""}`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="tool-bar no-print">
          {currentCatObj.tools.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTool(t.id)}
              className={`tool-tab ${activeTool === t.id ? "active" : ""}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ paddingBottom: 48 }}>
          <Card glow={T.accentGlow}>{renderTool()}</Card>
          <div style={{ marginTop: 18, textAlign: "center", fontSize: 11.5, color: T.textTer }}>
            Verktøyene er til veiledning og simulering i rådgivningssammenheng og erstatter ikke individuell skatte- eller finansiell rådgivning.
          </div>
        </div>
      </div>
    </div>
  );
}
