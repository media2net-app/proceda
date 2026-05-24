# Demo-pipeline (na scrape)

## Volgorde (zelfde als scrape-pipeline)

1. Makelaardij  
2. Installatie  
3. Vastgoedbeheer  
4. Accountants & boekhouding  
5. Recruitment & detachering  
6. Verzekeringsadvies  

**Doel:** ≥200 leads **demo-klaar** per verticale (logo + ≥2 huisstijlkleuren van de website).

## Stappen per lead (zoals makelaardij)

1. **Probe** — website ophalen, logo/kleuren extractie (`demo-ready-probe`)  
2. **Build** — logo downloaden, `demo-brands.json`, homepage in `/public/demos/{slug}/`, DB `DemoBrand`  

## Autopilot

- Header-knop: **Demo-klaar** → modus `demo_prep`  
- Terminal: stappen `demo-probe` en `demo-build`  
- Bij 200 demo-klaar: automatisch volgende verticale  
- Tick-interval: ~2 min (zwaarder dan scrape)

## Branch-templates

Copy per verticale in `src/lib/demo-homepage/branch-config.ts` (`SCRAPE_BRANCH_DEMO`).

**Showcase bekijken (eenmalig genereren):**

```bash
npx tsx scripts/generate-branch-showcase-demos.ts
```

Daarna: `http://localhost:3000/nl/demos/showcase-accountants` (enz.)

## Handmatig (zonder autopilot)

```bash
BRANCH=accountants npx tsx scripts/count-demo-ready.ts --limit=100
BRANCH=accountants npx tsx scripts/generate-demo-dashboard-batch.ts --limit=50
```
