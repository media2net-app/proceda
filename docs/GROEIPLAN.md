# Groeiplan Proceda

Strategisch plan voor inzichten, sales-ops en schaalbare outbound. Bouwt voort op de bestaande stack: live analytics, mail-KPI’s, demo-click stats per token, pipeline per provincie.

**Laatste update:** mei 2026

---

## Huidige stand

| Laag | Sterk | Beperking |
|------|--------|-----------|
| **Live view** | Realtime bezoekers, boek-intent, top pages | Geen koppeling mail-campagne → boeking per lead |
| **Mail admin** | sent/booked, demoVisited, follow-up ready | Geen open/reply/bounce; geen cohort per send-datum |
| **Bedrijven KPI** | Pool, hot/warm, pipeline € | `successfulDeals` uit CRM `won` |
| **Analytics DB** | `mailToken`, `bookingActive`, page views | Geen expliciete funnel-events |

We meten **traffic**, maar nog niet genoeg **outbound ROI per stap**.

---

## Fase 0 — Quick wins (1–2 weken)

Doel: elke ochtend in 2 minuten weten *waar het lekt*.

### 0.1 Outbound funnel-dashboard

Eén rij KPI’s over de hele keten (filter: verticale + periode):

```
Demo-ready → Verstuurd → Link geopend → Boekpagina engaged → Geboekt → No-show / Gewonnen
```

| Metric | Bron |
|--------|------|
| Demo-ready pool | audit + email |
| Verstuurd | `MailOutreach.status` |
| Geopend | `demo-click-stats` / `demoVisited` |
| Engaged | `bookingActive` op sessie |
| Geboekt | `booked` + `Appointment` |
| Gewonnen | handmatig veld (nieuw) |

### 0.2 Lead-timeline per bedrijf

Op één kaart voor elk bedrijf: `sentAt` → eerste klik → laatste activiteit → `bookedAt`, paden bezocht, status (koud / warm / heet / geboekt / verloren).

### 0.3 Live view & header — campagne-context

- Header link → `live-view?period=all`
- Filter **“Alleen outreach-leads”** (`mailToken IS NOT NULL`)
- Bedrijfsnaam bij actieve bezoekers

### 0.4 Bevestigingsmail + calendar invite (.ics)

Na boeken: bevestiging per e-mail + agenda-invite; sluit aan op belofte in booking-UI.

### 0.5 Dagelijkse actie-queue

| Queue | Regel |
|-------|--------|
| **Follow-up nu** | sent + demoVisited + geen follow-up + geen booked |
| **Bellen** | `bookingActive` maar niet geboekt binnen 24u |
| **Reply** | inbox inbound gekoppeld aan lead-email |
| **Na call** | appointment gisteren, status nog `scheduled` |

---

## Fase 1 — Inzichtensysteem 2.0 (2–4 weken)

### 1.1 Expliciete funnel-events

Tabel `AnalyticsEvent` (of `eventName` op page views):

| Event | Wanneer |
|-------|---------|
| `mail_link_open` | eerste hit `/demo/{token}` |
| `booking_view` | boekpagina geladen |
| `slot_select` | kalender-interactie |
| `booking_submit` | POST book |
| `booking_confirmed` | success |
| `demo_app_open` | `/demos/{slug}/app` |
| `mail_sent` | server-side bij send |

### 1.2 Cohort & send-batch analyse

Velden op `MailOutreach`: `campaignId`, `sendBatch`, optioneel `subjectVariant`. Rapport per batch: sent → open % → book % → median tijd tot book.

### 1.3 UTM in mail-links

`?utm_campaign=...` — parse in analytics, koppel aan token.

### 1.4 CRM-light (pipeline echt)

Status op lead: `lead` → `contacted` → `meeting` → `proposal` → `won` / `lost`. Hub: pipeline € gewogen, **Won €** echt, CAC (Places cost / booked).

### 1.5 Deliverability & mail health

Bounce-log, SPF/DKIM-checklist in admin, send-cap/warmup, suppress “niet meer mailen”.

### 1.6 Inbox ↔ lead

Match `InboxMessage` op email → thread op leadkaart; reply rate + reactietijd.

---

## Fase 2 — Sales machine (4–8 weken)

- **Batch send** (50/100, delay, throttle per domein)
- **Sequences** (dag 0 / 3 / 7 / 14 + suppress)
- **Bellijst-modus** (hot + telefoon + demoVisited)
- **A/B onderwerp** per batch
- **Installatie alignment** (eigen demo + follow-up + funnel-labels)
- **Post-booking** (reminder 24u/1u, na call status + voorstel-mail)

---

## Fase 3 — Schaal (8–12+ weken)

- **Command center** (één scherm: acties vandaag + funnel + cohort + live outreach-only)
- **Lead score** (heuristiek: demo-ready + hot + opens + bookingActive)
- **Multi-touch attributie** (`visitorId` + first/last touch)
- **Integraties:** Google Calendar, webhooks (Slack), Resend/Postmark
- **Compliance:** suppression list, audit log, guessed-email label
- **Inbound (optioneel):** vertical landings + waitlist

---

## Wat je makkelijk over het hoofd ziet

| Blinde vlek | Risico bij schaal |
|-------------|-------------------|
| Deliverability | 500 mails → spam = “systeem werkt niet” |
| Geen send-batches | Geen leren welke week/provincie werkte |
| Engaged ≠ geboekt | `bookingActive` is goud — nu onderbenut |
| Demo-app vs. mail-CTA | `/demos/`-traffic ≠ mail-conversie |
| Gewonnen deals = 0 | Pipeline € voelt groot, winst onzichtbaar |
| Gedeelde agenda | Dubbele slots / TZ-hardcode |
| Internal traffic | Admin/test vervuilt sessies |
| Installatie metrics | Mengen met makelaar |
| Reply ≠ click | Inbox niet centraal in funnel |

---

## Bouwvolgorde (impact × effort)

| # | Item | Status |
|---|------|--------|
| 1 | Bevestigingsmail + .ics | ✅ Fase 0 |
| 2 | Outbound funnel dashboard | ✅ Fase 0 |
| 3 | Actie-queue | ✅ Fase 0 |
| 4 | Live view outreach-filter + period=all link | ✅ Fase 0 |
| 5 | `AnalyticsEvent` + booking-stappen | ✅ Fase 1 |
| 6 | `sendBatch` + cohort | ✅ Fase 1 |
| 7 | CRM won/lost | ✅ Fase 1 |
| 8 | Batch send + throttle | ✅ Fase 2 |
| 9 | Mail sequences | ✅ Fase 2 |
| 10 | Command center | ✅ Fase 3 |
| 11 | Outreach lead score + attributie | ✅ Fase 3 |
| 12 | Compliance audit + suppressie | ✅ Fase 3 |
| 13 | UTM in mail-links + analytics | ✅ Fase 4 |
| 14 | Mail health (SPF/DMARC, dagcap) | ✅ Fase 4 |
| 15 | Inbox-thread + reply rate | ✅ Fase 4 |
| 16 | Geraden e-mail label + Slack webhook | ✅ Fase 4 |
| 17 | Waitlist API | ✅ Fase 4 |

**Admin dark mode** — ✅ gedaan (mei 2026).

**Fase 0 (mei 2026)** — bevestigingsmail, funnel + actie-queue op KPI-dashboard, live view outreach-filter, lead-timeline in mail-detail.

**Fase 1 (mei 2026)** — `AnalyticsEvent` + booking-stappen, `sendBatch` cohort-panel, CRM pipeline (won/lost) op leadkaart, funnel-stap Gewonnen.

**Fase 2 (mei 2026)** — batch send (50/100, throttle), sequences dag 3/7/14, bellijst, A/B onderwerp, booking reminders 24u/1u.

**Fase 3 (mei 2026)** — command center (acties + funnel + cohort + live outreach), outreach lead score + first/last touch, audit log + suppressielijst.

**Fase 4 (mei 2026)** — UTM in mail-links, mail health panel, inbox-thread op leadkaart, reply rate, geraden e-mail badge, Slack bij boeking, waitlist API.

**Fase 5 (mei 2026)** — live view default outreach-only, bounce-detectie bij mail-sync (auto suppress), waitlist-panel in command center, recente bounces in mail health.

**Fase 6 (mei 2026)** — header Start/Stop autopilot: inbox-sync, sequences, follow-ups, batch send, lead-scrape per provincie (Vercel cron elke 5 min).

**Mobiel & cross-browser (mei 2026)** — viewport/safe-area, iOS input-zoom fix, admin mail master-detail op mobiel, sticky boek-CTA, horizontale KPI-scroll, `src/styles/mobile-compat.css`.

---

## Succescriteria

### Na 4 weken (makelaardij, één provincie-batch)

- [ ] ≥50 mails verstuurd met `sendBatch` id
- [ ] Funnel-dashboard: open %, engaged %, book % bekend
- [ ] ≥1 geboekte call traceerbaar sent → open → book
- [ ] Follow-up queue leeg of bewust uitgesteld
- [ ] Geen booking zonder bevestigingsmail

### Na 8 weken

- [ ] Cohort vergelijking batch A vs B
- [ ] Reply rate zichtbaar; ≥1 deal `won` of `lost` gelogd
- [x] Live view default: alleen outreach-verkeer

---

## Wat níet eerst bouwen

- Extra 3D-globe / heatmaps zonder actie
- ML lead scoring (heuristiek volstaat tot ~500 sends/maand)
- Volledig CRM (status + won/lost + notities is genoeg)
- Marketing rebuild vóór werkende outbound

---

## Referenties in codebase

| Gebied | Pad |
|--------|-----|
| Verticalen | `docs/VERTICALES.md`, `src/lib/bedrijven/branches.ts` |
| Mail / outreach | `src/lib/mail/`, `src/components/admin/MailView.tsx` |
| Booking | `src/app/api/demo/[token]/book/route.ts`, `DemoBookingView.tsx` |
| Analytics | `src/lib/analytics-live.ts`, `src/lib/mail/demo-click-stats.ts` |
| Admin hub | `src/components/admin/AdminKpiDashboard.tsx` |
