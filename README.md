# Finansverktøy — Private Banking

Kalkulatorer og analyseverktøy med norske skatteregler.

## Verktøy

- 📈 **Rentes rente** — compound kalkulator med skatt, inflasjon, rentes rente-tabell
- 🏦 **Wealth Planner** — levetidsberegning med norske skatteregler, skjermingsfradrag, Monte Carlo
- 💸 **Kostnadseffekt** — visualiserer forvaltningskostnadenes rentes rente-effekt
- 🔥 **FIRE** — kalkulator for økonomisk uavhengighet
- 🏠 **Lånekalkulator** — annuitet/serielån med skattefradrag
- ⚖️ **Allokering** — anbefalt porteføljefordeling etter profil
- 🌍 **Markedspuls** — nøkkeltall: P/E, CAPE, Buffett Indicator, Fear & Greed m.m.

## Oppsett

```bash
npm install
npm run dev
```

## Deploy

```bash
git add . && git commit -m "oppdatering" && git push
```

Vercel deployer automatisk ved push til main.

## Norske skatteregler (forenklet)

- Aksjegevinst: 37,84% eff. sats (oppjusteringsfaktor 1,72×)
- Formuesskatt: 1,0% opp til 20M, 1,1% over 20M (bunnfradrag 1,7M)
- Verdsettelsesrabatt aksjer: 20%
- Skjermingsrente: 3,2%
- Rentefradrag: 22%
