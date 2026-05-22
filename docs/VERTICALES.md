# Proceda verticalen (branches)

## Overzicht

| Branch id | UI | Mail / huisstijl | Scrape |
|-----------|-----|------------------|--------|
| `makelaardij` | Sidebar + hub | Ja | NL provincies |
| `installatie` | Sidebar + hub (pilot) | Ja | NL provincies |
| `lenjerii-hotel` | Alleen dropdown Bedrijven | Nee | RO județe |

## Data

```
data/
  campaigns/
    makelaardij/
      demo-ready-audit.json
      demo-brands.json
    installatie/
      demo-ready-audit.json   # na count-demo-ready
      demo-brands.json        # na generate-demo-dashboard-batch
  bedrijven/
    makelaardij/
    installatie/
    lenjerii-hotel/
```

Legacy `data/demo-ready-audit.json` wordt bij lezen automatisch gemigreerd naar `campaigns/makelaardij/`.

## Admin

- **Sidebar:** verticale-kiezer (makelaardij / installatie)
- **Dashboard:** hub met KPI’s per verticale
- **Mail / Huisstijl / KPI:** filteren op actieve verticale (`?branch=`)

## Installatie pilot

```bash
# 1. Scrape
npx tsx scripts/scrape-installatie-batch.ts
PROVINCE=zuid-holland TARGET=200 npx tsx scripts/scrape-installatie-batch.ts

# 2. Demo-ready audit
BRANCH=installatie npx tsx scripts/count-demo-ready.ts --limit=100

# 3. Demos + brands
BRANCH=installatie npx tsx scripts/generate-demo-dashboard-batch.ts --limit=20
```

Mail en outreach gebruiken `buildInstallatieDemoProposalDraft` via `src/lib/mail/outreach-draft.ts`.
