# ROIS reklāmu budžeta kalkulators - dizaina spec

**Datums:** 2026-06-09
**Tips:** Iekšējais rīks (piedāvājumiem), koplietojams ar kolēģiem caur Vercel linku

## Mērķis

Ātrs web rīks ROIS komandai, kas sadala klienta kopējo mēneša budžetu starp **apkalpošanas maksu** un **reklāmas budžetu**. Kolēģis atver Vercel linku, ievada summu, regulē sadalījumu un nolasa/screenshoto rezultātu klienta piedāvājumam.

## Scope (MVP)

2 līmeņu sadalījums: `Total → apkalpošana (%) + reklāmas budžets (%)`.

### Ievade un mijiedarbība
- **Kopējais budžets** - liels editable EUR lauks augšā (mēnesī). Default `1000`.
- **Slider** - regulē apkalpošanas %, default 30% (→ reklāma 70%). Diapazons 0-100%.
- **Manuāla % ievade** - skaitļa lauks, sinhronizēts ar slideri (abi maina to pašu stāvokli).
- **Preset pogas** - 20% / 30% / 40% apkalpošanai; viens klikšķis uzliek sadalījumu un aktīvā poga izceļas.

### Izvade (Layout A - vertikāle)
- Divas rezultātu kartiņas zem kontrolēm:
  - **Apkalpošana** - EUR summa + `X% no budžeta`
  - **Reklāmas budžets** - EUR summa + `X% no budžeta`, zeltainā akcentā (`.lead` stils)
- Skaitļu formāts: LV stils, atstarpe tūkstošos, EUR pēc skaitļa: `1 000 EUR`. Noapaļo līdz veseliem EUR.
- Noapaļošanas loģika: apkalpošana = `round(total * mgmtPct / 100)`, reklāma = `total - apkalpošana`. Tā abas summas vienmēr saskaitās tieši uz Total (nav 1 EUR neatbilstības).

## Dizains (ROIS stils)
- Fons `#090907`, paneļi `#13120f` / `#1b1a16`, līnijas `#2a2823`
- Akcents zelts `#D5A134`, mīkstais `#e7c074`
- Teksts `#f4f1ea`, muted `#9a948a`
- Fonti: Poppins (virsraksti, skaitļi, 600/700), Montserrat (body)
- Noapaļoti stūri (14-18px), mobile-first, centrēta viena kolonna ar max-width
- Tikai īsā defise `-` visā UI tekstā (NEKAD em/en-dash)

## Tech
- **Vite + React + TypeScript + Tailwind CSS**
- Viena lapa, viens galvenais komponents (`Calculator`). Stāvoklis: `total`, `mgmtPct`. Reklāma = `100 - mgmtPct`.
- Zero backend, viss aprēķins klienta pusē. Pure funkcija budžeta sadalei (viegli testējama).
- Google Fonts caur `<link>` vai `@import`.

## Ārpus scope (apzināti)
- Kanālu sadalījums (Meta/Google/u.c.) un prognozes (CPL/klikšķi)
- Lead capture forma
- PDF eksports (dizains pietiekami tīrs screenshotam)
- Vairākvalodu (tikai LV)
- Backend / datu saglabāšana

## Deploy
- Public GitHub repo `rois-ad-calculator` (GatisD)
- Git commits: autors `Gatis Daugavietis <gatis.design@gmail.com>` (Vercel bloķē Claude)
- Vercel projekts → viens publisks links kolēģiem

## Testēšana
- Unit tests budžeta sadales funkcijai: 30/70 no 1000 → 300/700; robežgadījumi 0% un 100%; noapaļošana (piem. 333.33 → 333).
- Manuāla pārbaude: slider ↔ input ↔ preset sinhronizācija; LV skaitļu formāts.
