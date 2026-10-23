# Nocturnal

Zenei ízlés alapú esemény- és közösségi mobilapp iOS-re és Androidra. A „Nocturnal” munkacím.

- Feladatleírás és szabályok: [CLAUDE.md](CLAUDE.md)
- Architektúra-terv (0. fázis): [docs/PHASE0.md](docs/PHASE0.md)
- Döntésnapló: [docs/DECISIONS.md](docs/DECISIONS.md)

## Technológia

- Expo SDK 57 (React Native 0.86, React 19.2), TypeScript (strict)
- Expo Router (navigáció), i18next (magyar és angol felület), Zustand (kliensállapot)
- Jest, React Native Testing Library, ESLint, Prettier
- Backend: Supabase (EU, Frankfurt) — Auth, Postgres, Storage, Edge Functions; az API-ban Hono és Drizzle ORM ([docs/PHASE0.md](docs/PHASE0.md), 2.1)
- TanStack Query (szerveradat), zod (közös adatszerződések az app és az API között)

## Előfeltételek

- Node.js 22 (lásd `.nvmrc`) és npm
- A telefonon az **Expo Go** app (App Store, Google Play). Az Expo Go mindig csak a legfrissebb Expo SDK-t támogatja (most az 57-et).
- Opcionális: Android-emulátor (Android Studio). iOS-szimulátor csak macOS-en fut.

## Indítás

```sh
npm ci
cp .env.example .env   # majd töltsd ki (lásd: Környezeti változók)
npm start
```

Ezután a terminálban megjelenő QR-kódot kell beolvasni: iPhone-on a Kamera appal, Androidon az Expo Go-val. A telefon és a gép legyen ugyanazon a Wi-Fi-hálózaton.

**A Google-belépés kipróbálásához így indítsd: `npm run start:lan`.** Alapból az Expo Go IP-címes címet használ (`exp://192.168.x.x:8081`), a Supabase pedig biztonsági okból nem irányít vissza IP-címre (a belső `127.0.0.1` kivételével), ezért a belépés után a „Site URL”-re esne vissza. A `start:lan` a géped helyi címét egy nip.io névvel adja meg (pl. `exp://192.168.0.170.nip.io:8081`); ezt a nyilvános DNS ugyanarra a helyi címre fordítja, a Supabase `exp://**` szabálya pedig lefedi. A telefon közvetlenül, a Wi-Fin csatlakozik, így gyors.

Ha a telefon így nem éri el a gépet (egyes routerek tiltják, hogy egy nyilvános név helyi címre mutasson), használd a tunnelt: `npm run start:tunnel`. Ez lassabb, és az ngrok az első kapcsolódást néha eldobja („failed to start tunnel – remote gone away”); ilyenkor indítsd újra.

A `.env` nélkül az app induláskor hibaüzenettel leáll, mert nem tudja, melyik Supabase-projekthez kapcsolódjon.

## Parancsok

| Parancs | Mit csinál |
|---|---|
| `npm start` | Fejlesztői szerver (Expo Go) |
| `npm run start:lan` | Fejlesztői szerver helyi hálózaton, nip.io névvel (az Expo Go-s Google-belépéshez; ajánlott) |
| `npm run start:tunnel` | Fejlesztői szerver tunnel módban (ha a `start:lan` nem működik) |
| `npm run typecheck` | TypeScript-ellenőrzés |
| `npm run lint` | ESLint- és Prettier-ellenőrzés |
| `npm run format` | A kód automatikus formázása |
| `npm test` | Tesztek |
| `npm run test:watch` | Tesztek figyelő módban |
| `npm run db:generate` | Új adatbázis-migráció generálása a Drizzle-sémából |
| `npm run db:push` | A migrációk felküldése a Supabase-projektre |
| `npm run functions:deploy` | Az `api` Edge Function telepítése |

A CI (GitHub Actions) minden pull requesten lefuttatja a typecheck, a lint és a tesztek lépést.

## Környezeti változók

- A kulcsok listája a `.env.example` fájlban van. Másold le `.env` néven, és töltsd ki. A `.env` soha nem kerül a repóba.
- `EXPO_PUBLIC_SUPABASE_URL` és `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: a Supabase felületén, a Project Settings → API Keys oldalon. Mindkettő nyilvános adat.
- Az appból csak az `EXPO_PUBLIC_` előtagú változók érhetők el, és ezek bekerülnek az app kódjába. **Titok (API-kulcs, client secret, token) soha nem kerülhet beléjük**; a titkok helye az EAS Secrets és a Supabase secrets.
- `GOOGLE_MAPS_ANDROID_API_KEY`: csak az androidos buildhez kell (a térképhez), az Expo Go-hoz nem. A Google Cloudban a Maps SDK for Androidra és az app csomagnevére, aláírókulcsára korlátozva, EAS-környezeti változóként kell megadni.

## Mappaszerkezet

```
src/
├─ app/            # képernyők és navigáció (Expo Router): minden fájl egy útvonal
│  ├─ (auth)/      # belépés, regisztráció, e-mail-megerősítés, új jelszó (navbar nélkül)
│  ├─ (onboarding)/# profil létrehozása, streaming-szinkron, zenei ízlés (navbar nélkül)
│  ├─ (tabs)/      # a 3 elemű navbar: csevegőtér, Home (rács, térkép, eseményoldal), profilkereső
│  ├─ profile/     # profil (navbar nélkül)
│  └─ settings.tsx # Beállítások (navbar nélkül)
├─ components/     # közös UI-elemek
├─ features/       # funkciónkénti logika és állapot (auth, events, location, map, partners, profile, settings, taste)
├─ lib/            # Supabase-kliens, API-kliens, lekérdezés-gyorsítótár
├─ i18n/           # felületi szövegek (locales/hu.ts a forrás, az en.ts ugyanazokat a kulcsokat adja)
├─ theme/          # színek, sötét és világos mód
└─ __tests__/      # képernyőkön átívelő tesztek (az egységtesztek a kód mellett vannak)
supabase/
├─ functions/
│  ├─ api/         # az egyetlen API Edge Function (app.ts: útvonalak és szabályok; index.ts: bekötés)
│  └─ _shared/     # közös kód: adatszerződések, adatbázisséma, ízlés, ajánlás, partnerek
├─ migrations/     # SQL-migrációk (a drizzle-kit generálja őket, plusz kézzel írtak)
├─ templates/      # e-mail-sablonok (megerősítő és jelszó-visszaállító kód)
└─ config.toml     # helyi Supabase-beállítások
scripts/           # fejlesztői parancsok (helyi hálózati indítás)
__mocks__/         # a natív modulok (térkép, csúszka, helymeghatározás) helyettesítői a tesztekhez
```

## Backend (Supabase)

A projekt: `ryqbsalvqwvamhrcliht` (Frankfurt). A Supabase CLI fejlesztői függőség; egyszer be kell lépni vele: `npx supabase login`.

- **Adatbázis:** a séma a `supabase/functions/_shared/db/schema.ts`-ben van. Módosítás után `npm run db:generate`, majd `npm run db:push`. A távolság szerinti kereséshez a PostGIS bővítmény van bekapcsolva; az események változásáról a Realtime nyilvános `events` csatornája értesíti az appokat.
- **API:** az `api` Edge Function; módosítás után `npm run functions:deploy`. A hitelesítést maga a függvény végzi (`@supabase/server`), ezért token nélkül 401-et ad.
- **A Supabase felületén élő beállítások** (a `config.toml` csak a helyi környezetet írja le):
  - Authentication → Sign In / Providers → Email: e-mail-megerősítés bekapcsolva, **Email OTP Length: 6**, **Minimum password length: 8**.
  - Authentication → Emails → Templates: a „Confirm signup” és a „Reset password” sablon tartalma a `supabase/templates/` két fájlja.
  - Authentication → Sign In / Providers → Google: bekapcsolva (a Client ID és a secret csak itt van, a repóban nincs).
  - Authentication → URL Configuration → Redirect URLs: `exp://**` (az Expo Go tunnel-címeihez; csak fejlesztéshez, kiadás előtt törlendő) és `nocturnal://**`. IP-címes `exp://192.168…` bejegyzés hiába kerül fel: a Supabase az IP-címre való visszairányítást a listától függetlenül elutasítja.
- **E-mail-küldés:** a Supabase beépített szolgáltatása csak a Supabase-szervezet tagjainak küld, és óránként csak néhány levelet. Teszteléshez mindkét fejlesztő legyen tagja a szervezetnek.

## Partnerfiókok (D-008)

Az eseményeket a partnerek (klubok, bárok, koncerthelyszínek, szervezők) maguk töltik fel, a saját fiókjukból.

- **Regisztráció:** a belépés és a regisztráció képernyő alján, „Partnerregisztráció”. Csak e-mail-címmel és jelszóval lehet (Google nélkül). Előbb a teljes kérelmet kell kitölteni, a 6 jegyű kód a végén jön, és a kód beírása után a kérelem magától elmegy (D-008/22). Aki a kód előtt abbahagyja, később ugyanazzal a címmel újrakezdheti.
- **Kérelem:** nyilvános név, felhasználónév, logó, cégnév, adószám (az ellenőrző számjeggyel együtt ellenőrizve), kapcsolattartó és telefonszám, a helyszín címe, opcionálisan weboldal; a partner elfogadja a partneri feltételeket és az adatvédelmi tájékoztatót. Ízlést nem választ.
- **Értesítés a csapatnak:** minden beküldött és javított kérelemről e-mail megy a `PARTNER_REVIEW_EMAIL` címre (`partner@nocturnal.hu`), a Resend API-n keresztül. Ehhez két Supabase secret kell:
  ```sh
  npx supabase secrets set RESEND_API_KEY=<a Resendben létrehozott kulcs> PARTNER_REVIEW_EMAIL=partner@nocturnal.hu
  ```
  A kulcsot a Resend felületén kell létrehozni (API Keys → Create API Key, „Sending access”, a `nocturnal.hu` domainre). Soha nem kerül a repóba vagy a chatbe. Kulcs nélkül a kérelem ugyanúgy elmentődik, csak az e-mail marad el.
- **Elbírálás:** egyelőre a Supabase felületén: Table Editor → `partners` → `status` (`approved` vagy `rejected`; elutasításnál a `rejection_reason` az indoklás, ezt a partner az appban látja).
- **Védett nevek:** egy jóváhagyott partner nevét és felhasználónevét, illetve a nagyon hasonlókat (pl. „fogashaz.official”, vagy egy betű eltéréssel) más nem veheti fel. A szabályok: `supabase/functions/_shared/partners/protected-names.ts`.

## Build (EAS)

Az app az EAS-projekthez már össze van kötve: **`@nocturnal_app/nocturnal`**, a csapat `nocturnal_app` Expo-szervezetében. Az azonosító és a tulajdonos az `app.config.ts`-ben van. Az `eas.json` három profilt tartalmaz: `development`, `preview` és `production`.

A D-003 döntés szerint egyelőre Expo Go-val dolgozunk, ezért buildet még nem futtatunk. Amikor szükség lesz rá:

```sh
npx eas-cli@latest login     # olyan fiókkal, amely tagja a nocturnal_app szervezetnek
npx eas-cli@latest build --profile preview --platform android
```

- Az iOS-buildhez Apple Developer Program-tagság kell.
- A `development` profilhoz előbb telepíteni kell az `expo-dev-client` csomagot.

## Munkafolyamat

- A `main` ág védett. Minden munka külön ágon készül (`feature/…`, `fix/…`, `chore/…`, `docs/…`), és pull requesttel, egy jóváhagyással kerül a `main`-re.
- Commitüzenetek: Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`, `test:`, `docs:`).
- A kódban az elnevezések és a kommentek angolul vannak. A felületi szövegek kizárólag a `src/i18n/locales` mappába kerülnek.
- Új függőséget `npx expo install <csomag>` paranccsal telepítünk, hogy az Expo SDK-val kompatibilis verzió kerüljön be.
