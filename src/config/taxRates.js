// Sentrale norske skatte- og folketrygdsatser samlet på ett sted.
// Oppdateres ved behov når nye regler eller G-beløp vedtas.

export const TAX = {
  // Generell inntekt og selskapsskatt
  SKATT_ALM: 0.22,
  SELSKAPSSKATT: 0.22,

  // Aksje- og utbyttebeskatning privat (oppjusteringsfaktor 1,72 -> 37,84 %)
  OPPJUSTERING: 1.72,
  EFF_AKSJE_SKATT: 0.22 * 1.72, // 0.3784

  // Fritaksmetoden for AS (EØS): 0 % gevinstskatt, 3 % av utbytte inntektsføres til 22 % -> 0,66 %
  FRITAK_UTBYTTE_SKATT: 0.22 * 0.03, // 0.0066
  ANTATT_UTBYTTEANDEL_AKSJE: 0.02,

  // Formuesskatt
  FORMUE_BUNNFRADRAG_ENSLIG: 1760000,
  FORMUE_BUNNFRADRAG_EKTEPAR: 3520000,
  FORMUE_TRINN2_GRENSE_ENSLIG: 20700000,
  FORMUE_TRINN2_GRENSE_EKTEPAR: 41400000,
  FORMUE_SATS_TRINN1: 0.01,  // 1,0 %
  FORMUE_SATS_TRINN2: 0.011, // 1,1 %

  // Verdsettelsesrabatt i formuesskatt
  AKSJE_RABATT: 0.20, // 20 % rabatt -> 80 % formuesverdi
  PRIMARBOLIG_RABATT_LAV: 0.75, // 75 % rabatt under terskel -> 25 % formuesverdi
  PRIMARBOLIG_RABATT_HOY: 0.50, // 50 % rabatt over 10 MNOK -> 50 % formuesverdi
  BOLIG_HOY_TERSKEL: 10000000,

  // Skjermingsrente
  SKJERMINGSRENTE: 0.039, // 3,9 %

  // Personinntekt, trygdeavgift og arbeidsgiveravgift (for Lønn vs. Utbytte)
  G_BELOP: 130160, // Grunnbeløp i folketrygden (referanseverdi)
  TRYGDEAVGIFT_LONN: 0.078, // 7,8 % på lønnsinntekt
  AGA_SONE1: 0.141, // 14,1 % arbeidsgiveravgift (standard)
  TRINNSKATT: [
    { from: 217400, rate: 0.017 },
    { from: 306050, rate: 0.040 },
    { from: 697150, rate: 0.137 },
    { from: 942400, rate: 0.167 },
    { from: 1410750, rate: 0.177 }
  ],

  SATSER_TEKST: "Norske satser · 37,84 % aksje · 22 % selskapsskatt · 20 % aksjerabatt"
};

export function calcTrinnskatt(personinntekt) {
  let tax = 0;
  for (let i = 0; i < TAX.TRINNSKATT.length; i++) {
    const cur = TAX.TRINNSKATT[i];
    const nextFrom = TAX.TRINNSKATT[i + 1]?.from ?? Infinity;
    if (personinntekt > cur.from) {
      const slice = Math.min(personinntekt, nextFrom) - cur.from;
      tax += slice * cur.rate;
    }
  }
  return tax;
}

export function calcWealthTaxDetailed({
  totalWealth,
  equityShare = 1,
  debt = 0,
  married = false
}) {
  if (totalWealth <= 0) {
    return {
      grossWealth: 0,
      discountAmount: 0,
      grossTaxable: 0,
      deductibleDebt: 0,
      netTaxable: 0,
      bunnfradrag: married ? TAX.FORMUE_BUNNFRADRAG_EKTEPAR : TAX.FORMUE_BUNNFRADRAG_ENSLIG,
      trinn1Tax: 0,
      trinn2Tax: 0,
      totalTax: 0
    };
  }

  const eq = Math.max(0, Math.min(1, equityShare));
  const equityValue = totalWealth * eq;
  const fixedValue = totalWealth * (1 - eq);

  const discountAmount = equityValue * TAX.AKSJE_RABATT;
  const grossTaxable = equityValue * (1 - TAX.AKSJE_RABATT) + fixedValue;

  const taxableRatio = grossTaxable / totalWealth;
  const deductibleDebt = debt * taxableRatio;

  const netTaxable = Math.max(0, grossTaxable - deductibleDebt);
  const bunnfradrag = married ? TAX.FORMUE_BUNNFRADRAG_EKTEPAR : TAX.FORMUE_BUNNFRADRAG_ENSLIG;
  const trinn2Grense = married ? TAX.FORMUE_TRINN2_GRENSE_EKTEPAR : TAX.FORMUE_TRINN2_GRENSE_ENSLIG;

  const trinn1Belop = Math.max(0, Math.min(netTaxable, trinn2Grense) - bunnfradrag);
  const trinn2Belop = Math.max(0, netTaxable - trinn2Grense);

  const trinn1Tax = trinn1Belop * TAX.FORMUE_SATS_TRINN1;
  const trinn2Tax = trinn2Belop * TAX.FORMUE_SATS_TRINN2;

  return {
    grossWealth: totalWealth,
    discountAmount,
    grossTaxable,
    deductibleDebt,
    netTaxable,
    bunnfradrag,
    trinn1Tax,
    trinn2Tax,
    totalTax: trinn1Tax + trinn2Tax
  };
}

export function calcWealthTax(params) {
  return calcWealthTaxDetailed(params).totalTax;
}

export function grossUpDividend(netNeeded) {
  if (netNeeded <= 0) return 0;
  return netNeeded / (1 - TAX.EFF_AKSJE_SKATT);
}
