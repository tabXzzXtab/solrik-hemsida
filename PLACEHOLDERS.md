# Att fylla i och granska / To fill in and review

Webbplatsen visar inga `[platshållare]`. Det som saknas är **dolt** tills det fylls i, och
texter som skrivits utan underlag är markerade nedan för granskning.

## 1. Saknas – dolt tills det fylls i (`src/config/company.ts`)

- [ ] `REGISTERED_OFFICE` – styrelsens säte (kommun) enligt registreringsbeviset. **Ska stå på webbplatsen** – visas i sidfoten när det är ifyllt.
- [ ] `F_SKATT` – sätt till `true` när det är bekräftat ("Godkänd för F-skatt" i sidfoten).
- [ ] `CERTIFICATIONS` – endast sådant ni har (t.ex. ID06, Byggföretagen). Tom lista = avsnittet på Om oss döljs.
- [ ] `KEY_FIGURES` – riktiga nyckeltal. Tom lista = "Solrik i siffror" på startsidan döljs.
- [ ] `PARENT_GROUP.url` – Radiant Groups webbadress (valfritt, används i strukturerad data).
- [ ] `LINKEDIN_URL`, `INSTAGRAM_URL` – valfritt, visas i sidfoten när de är ifyllda.
- [ ] `SHOW_TENANTS_PAGE` – sidan "Hyresgäst & boende" är dold (`false`). Sätt `true` för att visa den igen; fyll då även i `TENANT_PORTAL_URL` om det finns en hyresgästportal.

## 2. Skrivet utan underlag – granska att det stämmer (`src/i18n/sv.json` + `en.json`)

- [ ] Om oss – "Vilka vi är" (about.story) och hållbarhet (about.sustainability)
- [ ] Löftena på startsidan och tjänstesidorna (`PROMISES` i company.ts): fast pris, garanti enligt standardavtal, en avtalspart, BAS-P/BAS-U, akuta fel går först
- [ ] Garanti: formulerad som "enligt branschens standardavtal" utan antal år (tjänsterna nybyggnation och renovering)
- [ ] Svarstider: "normalt inom ett par arbetsdagar" (formulär, tack-sida, tillgänglighet) och "några arbetsdagar" för felanmälan
- [ ] Fastighetsdrift: jour beskrivs som en del av tjänsten – stämmer det? (services.items.fastighetsdrift)
- [ ] Karriär – arbetsplatsen, utveckling, lärlingar; spontanansökningar sparas sex månader (careers)
- [ ] Integritetspolicy – lagringstider: offertförfrågningar 12 mån, felanmälningar 2 år, jobbansökningar 6 mån (legal.privacy)
- [ ] Tillgänglighetsredogörelse – granskad oktober 2026 med automatiska verktyg och tangentbord (legal.accessibility)
- [ ] Hyresgästsidan (dold): trivselregler och in-/utflyttning (tenants)

## 3. Innehåll – `src/content/`

Inga projekt, nyheter eller jobbannonser är publicerade. Sidorna Projekt och Nyheter döljs
ur menyerna och får `noindex` tills det finns minst en post. Filerna med `example: true` är
mallar – de byggs bara med `PUBLIC_SHOW_EXAMPLES=true`.

- [ ] Lägg till riktiga projekt (`projects/sv/*.md` + `projects/en/*.md`)
- [ ] Nyheter och lediga jobb när det finns

## 4. Bilder

- [ ] Fotona är stockbilder från Pexels (fria att använda utan namnuppgift). Byt successivt till egna foton – spara över filerna i `src/assets/images/` och uppdatera `alt` i `src/config/images.ts`.
- [x] Logotyp och favicons – från `logo-removebg-preview.png` via `npm run brand -- logo-removebg-preview.png`

## 5. Dokument – `public/dokument/`

- [ ] Checklistan inför stambyte (sv + en) är färdigskriven – granska innehållet.
- [ ] Hyresgästblanketterna är platshållare (sidan är dold): `blankett-*.pdf`

## 6. Driftsättning

- [ ] `PUBLIC_SITE_URL` – den riktiga domänen (canonical, sitemap, Open Graph)
- [ ] Formulär: `PUBLIC_FORM_PROVIDER=custom` mot n8n. Byt `webhook-test`-adresserna till produktionsadresserna (`/webhook/…`) och tillåt webbplatsens domän (CORS) i n8n. Formulären skiljs åt med det dolda fältet `form` (`quote` / `faultReport`); `language` anger sv/en.
- [ ] Valfritt: analys (`PUBLIC_ANALYTICS_PROVIDER` …) och verifiering för Search Console/Bing
