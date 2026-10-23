# Átadás egy új beszélgetésnek — innen folytatjuk: 4b

Ez a fájl Claude Code-nak szól, hogy egy új beszélgetésben pontosan innen folytathassa a munkát. Állapot: **2026-10-23 este**.

**Új beszélgetés elején olvasd el, ebben a sorrendben:**

1. `CLAUDE.md` (a megrendelő szabályai, F1–F7, Q-lista, fázisok)
2. ezt a fájlt
3. `docs/DECISIONS.md`: D-007, D-008 (1–26), D-009, I-012, I-013, I-014
4. `README.md`: Partnerfiókok és Supabase szakasz

Az előző beszélgetés teljes átirata (csak a fejlesztő gépén van meg; szükség esetén grep-pel kereshető):
`C:\Users\Fekete Olivér\.claude\projects\c--Users-Fekete-Oliv-r-Documents-Nocturnal-App-partyapp\c86f5800-1909-4823-8eb2-2200307b079d.jsonl`

---

## 1. Hol tartunk

- **`main`** (bf78694): 0–4. fázis (projektváz, belépés, kézi ízlés, események, Home-rács, térkép) és a profilszerkesztés.
- **`feature/f5-partner-accounts`** (feltöltve a GitHubra, **még nincs a mainben**): a 4. fázis átdolgozásának első fele, a **4a**:
  - partnerregisztráció és partnerkérelem, „Hitelesített partner” pipa, védett nevek, partner-Home és partnerprofil (D-008/1–22);
  - a CSV-import és a mintaesemények eltávolítva (E-003);
  - az e-mail-kód a regisztráció **végén**: partnereknél (D-008/22) és magánszemélyeknél (D-009);
  - **elbírálás az appban** (D-008/23, I-014): `admins` tábla, Beállítások → „Nocturnal csapat” → „Partnerkérelmek”, jóváhagyás megerősítéssel, elutasítás indoklással, kétnyelvű döntési e-mail a partnernek.
- **Élesítve** a Supabase-projekten (`ryqbsalvqwvamhrcliht`, Frankfurt): minden migráció a `20261023184241_admins.sql`-ig, és az `api` Edge Function legfrissebb változata.
- **Tesztek:** 154 db, mind zöld; a typecheck és a lint hibátlan.

## 2. Mire várunk a felhasználótól (ezt kérdezd meg először)

1. **A 4a tesztjének eredménye** iPhone-on (Expo Go). Ha rendben van: PR (https://github.com/edvardinnyo/partyapp/compare/main...feature/f5-partner-accounts?expand=1), majd a jóváhagyása után helyi `--no-ff` merge a mainbe és push.
2. **Mely felhasználónevek kapjanak admin jogot.** SQL-lel kell kiadni (a parancs a README-ben van); ezt a felhasználó jóváhagyásával te is lefuttathatod: `npx supabase db query --linked "<sql>"`.
3. **A Home hirdetési sávjai (D-008/26)** — nyitott kérdések a 4b előtt:
   - Ki hirdethet: csak jóváhagyott partner, vagy külső cég is?
   - Mi van egy hirdetésben (kép, szöveg), és koppintásra hová visz (eseményre, partnerprofilra vagy külső oldalra)?
   - Mindenki látja a környéken, vagy ízlés szerint célozzuk?
   - Fizetős lesz-e (egyelőre kézzel, számlával)? A csapat jóváhagyja-e megjelenés előtt?
4. **Két javaslat, válasz nélkül:**
   - A bejelentett események elbírálása is az appban történjen („Bejelentett események” lista, „Leszedés” gomb), mert a D-008/17 szerinti egy kattintásos leszedés az e-mailből ugyanabba a korlátba ütközik, mint a jóváhagyás (lásd 5. pont).
   - Időzített feladat törölje azokat a megerősített fiókokat, amelyekhez 30 nap után sincs profil (adatvédelmi tájékoztatóban jelezni kell).

## 3. A 4b hatóköre (jóváhagyott döntések)

Forrás: D-008/6–9, 16–18, 24–26. Ezen túl semmit ne építs be (CLAUDE.md, 1. fejezet).

- **Esemény adatai (D-008/6):** cím, típus (klub / bár / koncert / fesztivál), kezdés és zárás, helyszín, 1–3 műfaj a közös listából (ez határozza meg, kinek ajánljuk), fellépők, jegyár (bruttó, forintban), rövid leírás (legfeljebb 1000 karakter), borítókép.
- **Helyszín és pin (D-008/24):** a partner címet ad meg, a pint az app teszi le a címből, a partner szükség esetén odébb húzhatja. A felhasználó kérdése volt, hogy ez **fizetés nélkül** megoldható-e; ingyenes geokódolás kell. Lehetőségek: `expo-location` `geocodeAsync` (a telefon saját geokódolója), vagy szerveroldali, ingyenes szolgáltatás a felhasználási feltételeinek betartásával. Ha külső szolgáltatás kell, az termékdöntés: kérdezz.
- **Közzététel (D-008/7, 16):** csak jóváhagyott partner tehet közzé, és az esemény azonnal megjelenik.
  - Előtte **előnézet** „Közzététel után csak mi módosíthatjuk” figyelmeztetéssel; a végleges közzététel gomb **5 másodpercig nem nyomható**, ezt animáció jelzi.
  - Közzététel után a partner **nem módosíthatja**. Helyette „Módosítás kérése” indoklással, e-mailben a csapatnak. **Lemondani** a partner maga is tudja.
  - Az adminok leszedhetik vagy módosíthatják az eseményt.
- **Bejelentés (D-008/7, 17):** a felhasználók indoklással jelenthetnek be egy eseményt, erről e-mail megy a csapatnak. A leszedés felülete a 2/4. pont szerinti javaslattól függ.
- **„Új esemény” gomb** a partner Home-ján, az eseményekkel egy helyen (D-008/8).
- **A partner Home-ja (D-008/18):** a távolságon belüli összes esemény kezdés szerint, a saját eseményei kiemelve.
- **Képek (D-008/9):** a Home-on és az eseményoldalon a partner borítóképe látszik. (A csevegőtér fejléce az 5. fázisban a legutóbb megosztott kép lesz.)
- **Jegy (D-008/25):** az eseményoldalon a jegyár látszik, a „Jegyvásárlás” gomb továbbra is „Hamarosan elérhető”. A jegyértékesítés külön fázis lesz, a 7. után, a kiadás előtt.
- **Hirdetési sávok (D-008/26):** csak a 2/3. pont válaszai után.

## 4. A meglévő kód, amelyre a 4b épül

- **Adatbázis** (`supabase/functions/_shared/db/schema.ts`):
  - A `venues` és az `events` táblában még a CSV-korszak `source` és `external_id` oszlopa van. Kell egy partnerhez kötés, valamint ár, leírás, borítókép és egy lemondott/leszedett állapot.
  - Az esemény állapota (közelgő, zajló, lezárt) nincs tárolva, az időpontokból számoljuk: `_shared/events/lifecycle.ts`.
  - A `broadcast_events_changed` trigger minden változáskor üzenetet küld a nyilvános `events` Realtime-csatornán; az app ekkor újratölti az eseményeket (`src/features/events/use-events-live-updates.ts`).
- **API** (`supabase/functions/api/app.ts`, Hono):
  - meglévő útvonalak: `POST /events/nearby` és `GET /events/:id`, az ajánlási pontszám a `_shared/recommendation/score-event.ts`-ben;
  - admin-ellenőrzés: `admins.isAdmin(userId)`;
  - e-mail: `partner-notifier.ts` (Resend) és `partner-email.ts` (minden felhasználói szöveg HTML-escape-elve);
  - a tesztek hamis függőségekkel futnak: `app.test.ts`, `createFakes()`.
- **Képtárolás:** privát `avatars` bucket, aláírt URL-ekkel; a feltöltés menete: `createAvatarUpload` → `uploadAvatar` (`src/features/profile/avatar-upload.ts`). A borítóképekhez valószínűleg saját bucket kell, ugyanígy.
- **App:**
  - Home: `src/app/(tabs)/(home)/index.tsx` (partnernél `PartnerStatusCard` és a „Események a közelben” felirat); rács: `src/features/events/home-grid.ts`; hirdetési hely: `ad-banner.tsx`; eseménycsempe: `event-tile.tsx`.
  - Eseményoldal: `src/app/(tabs)/(home)/event/[id].tsx`.
  - Térkép: `src/app/(tabs)/(home)/map.tsx` és `src/features/map/*`.
  - Admin-képernyők: `src/app/partner-applications/*`.
  - Szövegek: `src/i18n/locales/hu.ts` (forrás) és `en.ts` (tükör).

## 5. Fontos technikai tények

- Az Edge Function a Supabase alapdomainjén **nem szolgálhat ki HTML-oldalt**: a `text/html` válaszból `text/plain` lesz, csak fizetős egyedi domainnel működne. Ezért nincs egy kattintásos jóváhagyás az e-mailből.
- Egy még megerősítetlen e-mail-címre küldött újabb `signUp` megtartja az első jelszót és metaadatot. Ezért a kód után `updateUser`-rel állítjuk be a fióktípust és a jelszót (`src/features/auth/actions.ts`).
- Az API útvonalai: `/api/...` belépett felhasználóval, `/api/public/...` csak a publishable key-jel (`index.ts`). A függvény URL-je: `<SUPABASE_URL>/functions/v1/api/...`; a kérésben az útvonal `/api/...`-val kezdődik.
- Adószám-ellenőrzés: `_shared/contracts/partner.ts`; a felületen mutatott példa (`12345676-2-42`) érvényes, és teszt őrzi.
- Parancsok:
  - `npm run db:generate`, majd `npx supabase db push --yes`;
  - `npm run functions:deploy`;
  - `npx tsc --noEmit`, `npm run lint`, `npx jest`;
  - próbafuttatás: `npx supabase db query --linked -f <fájl>` egy `begin; … rollback;` blokkal, a migráció élesítése előtt.

## 6. Munkamódi ezzel a felhasználóval (a CLAUDE.md-n túl)

- A felhasználó magyarul ír, tegező, közvetlen hangnemben. Az app felülete is tegező.
- **Merge:** csak a felhasználó kifejezett kérésére, helyben, `--no-ff` merge commit-tal, utána push. A GitHub connector 403-at kap az `edvardinnyo/partyapp` repóra, ezért a PR-t a felhasználó nyitja meg a compare linkkel.
- **Commit:** a Conventional Commits szerint, angolul, a végén ezzel a sorral: `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- **Titkok:** a `RESEND_API_KEY` és a `PARTNER_REVIEW_EMAIL` (`partner@nocturnal.hu`) be van állítva Supabase secretként; a felhasználó állította be. Titkot soha ne kérj és ne írj ki a chatbe.
- **Adatvédelem:** az adatbázisból csak összesítő lekérdezést futtass, e-mail-címet vagy más személyes adatot ne írj ki.
- **Eszközcsapdák:**
  - Hosszabb szkriptet vagy fájltartalmat a Write eszközzel írj a scratchpadbe, és `node <fájl>`-lal futtasd. Hosszú `node -e` és backtickes heredoc nem működik ebben a Bashben.
  - A `\u` + négy hexa alakú escape dekódolódik a tool-bemenetben.
  - Rövid (`C:\FEKETE~1`) útvonalat ne használj, és a beépített törlés-védelmet ne kerüld meg.
- **Minden fázis végén** (CLAUDE.md 9): összefoglaló, tesztelési útmutató (Expo Go, `npm run start:lan`), új kérdések és javaslatok a „💡 Javaslat (jóváhagyásra vár): mi · miért · mekkora munka · milyen kockázat” formában, PR. A döntéseket a `docs/DECISIONS.md`-be vezesd, és ezt a fájlt is frissítsd.

## 7. Utána

- **5. fázis** (F2, csevegőterek): csak a Q9–Q12 megválaszolása után.
- **Kiadás előtt** (`docs/RELEASE_CHECKLIST.md`): emlékeztetni kell a felhasználót a partneri feltételekre (jogász), a tartalom bejelentésére és letiltására (Q23 a, E-002), valamint a Sign in with Apple-re.
