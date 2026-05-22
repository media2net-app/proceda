# Follow-up outreach-mail

Eerste ronde (~702 verstuurd) is de **intro-mail**. De **follow-up** is een korte herinnering met dezelfde persoonlijke demo-link (`/demo/{token}`).

## Wanneer versturen

- Minimaal **3 werkdagen** na de eerste mail (`--min-days=3`, default).
- Alleen leads met status **`sent`**, nog **geen** `followupSentAt`, **niet** `booked`.
- Zelfde Hostinger-limiet: reken op max. **~1000 mails/dag**.

## Commando's

```bash
# Tellen wie in aanmerking komt (geen verzending)
npx tsx scripts/send-batch-followup-outreach.ts --dry-run --min-days=3

# Preview HTML voor eerste kandidaat
npx tsx scripts/preview-followup-mail.ts

# Versturen (pas `--min-days` aan op de dag zelf)
npx tsx scripts/send-batch-followup-outreach.ts --min-days=3 --delay-ms=3000
```

## Inhoud

- **Onderwerp:** `Herinnering — vrijblijvende demo voor {bedrijf}`
- Tekst: verwijzing naar mail vorige week, zelfde CTA-knop, zelfde dashboard-screenshot (indien aanwezig).
- Status blijft **`sent`**; alleen `followupSentAt` wordt gezet.

## Na follow-up

- Geen tweede follow-up in code (handmatig of nieuwe batch later uitbreiden).
- Geboekte leads (`booked`) worden automatisch overgeslagen.
