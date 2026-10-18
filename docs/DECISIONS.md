# Döntésnapló

A jóváhagyott és elutasított javaslatok, a megválaszolt nyitott kérdések (Q-lista) és az implementációs döntések.

---

## Jóváhagyott javaslatok

### D-001 — Kézi ízlésválasztás a streaming-szinkron alternatívájaként

- **Dátum:** 2026-10-06
- **Érintett:** F1, F6, Q4, Q5
- **Háttér:** A Spotify Web API Development Mode-ban legfeljebb 5 felhasználót enged; az Extended Quota Mode-hoz bejegyzett szervezet és legalább 250 000 havi aktív felhasználó kell. A kézi választás nem függ külső szolgáltatás felhasználói korlátjától.
- **Döntések:**
  1. A felhasználó streaming-szinkron helyett kézileg is megadhatja az ízlését. A kézi választás **végleges, teljes értékű funkció**, nem ideiglenes kerülőmegoldás.
  2. Több műfaj is választható, emellett kedvenc előadók és zenék is megadhatók. A top 3 műfajt az app számolja ki a kiválasztott műfajokból, előadókból és zenékből.
  3. Az előadók és zenék forrása az Apple Music API katalógusa. A katalógusban kereséshez nem kell felhasználói hitelesítés vagy Apple Music-előfizetés, csak a backenden tárolt developer token (Apple Developer Program-tagsággal).
  4. Az ízlés később módosítható: a **saját profil oldalon egy „Beállítások” menüpontban** (új felületi elem, kifejezetten jóváhagyva).
  5. Ha a felhasználó utólag streaming-fiókot is összeköt, a kézi és a streamingből számolt ízlés **fele-fele arányban keveredik**.
  6. Mennyiségi korlát: **legalább 3, legfeljebb 10 műfaj**. Az előadók és zenék megadása opcionális.
  7. A kedvenc előadók (kézi vagy streaming forrásból) **közvetlenül is számítanak az eseményajánlásban**, nemcsak a műfajok kiszámításában (Q5 részválasz).
  8. Az opcionális előadókból és zenékből **legfeljebb 20–20** adható meg.

### D-002 — Téma és nyelv: automatikus, kézi felülírással

- **Dátum:** 2026-10-13
- **Érintett:** Q22, D-001 (Beállítások)
- **Döntések:**
  1. **Téma:** alapból a telefon beállítását követi (sötét vagy világos). A Beállításokban kézzel is választható.
  2. **Nyelv:** magyar nyelvű telefonon magyar, minden más nyelvű telefonon angol. A Beállításokban kézzel is választható.
  3. A kezdetleges Figma-terv egyelőre **nem** kiindulási alap; a felület helykitöltő marad, amíg nincs végleges terv.

### D-003 — Expo Go a fejlesztés elején, development build később

- **Dátum:** 2026-10-13
- **Érintett:** CLAUDE.md 3.2 (development build), 1. fázis (EAS)
- **Döntés:** Egyelőre **Expo Go**-val fejlesztünk és tesztelünk, iOS-en és Androidon is. Az Apple Developer Program-tagság az első kiadáskor kerül szóba.
- **Következmények:**
  - Az EAS-profilok (development, preview, production) konfigurálva vannak, de buildet még nem futtatunk; az `expo-dev-client` csomag még nincs telepítve.
  - Ha egy funkcióhoz olyan natív modul kell, amely nincs az Expo Go-ban (pl. a natív Google-belépés gomb), előtte jelzem, és döntést kérek. Androidon a development build ingyenes.
  - Az Expo Go mindig csak a legfrissebb Expo SDK-t támogatja. Amikor az SDK 58 stabil lesz, frissíteni kell (külön `chore/` ágon), különben az Expo Go nem nyitja meg a projektet.
- **Kiegészítés (2026-10-18, D-004 alapján):** egyelőre **mindkét platformon Expo Go** marad. A natív Google-gombhoz development build kellene, de nincs Android telefonunk a teszteléshez, és iPhone-ra Apple Developer-tagság nélkül nem készíthető.

### D-004 — Belépés és regisztráció (2. fázis)

- **Dátum:** 2026-10-18
- **Érintett:** F6, Q4, Q20, Q23
- **Döntések:**
  1. **E-mail és jelszó.** Az e-mail-címet a Supabase által küldött 6 jegyű kóddal kell megerősíteni; a jelszó-visszaállítás is kóddal történik.
  2. **Google-belépés:** a cél a natív gomb, de amíg nincs development build (Android telefon, illetve Apple Developer-tagság), **mindkét platformon a böngészős Google-belépés** működik. A natív változat később, development builddel készül el; a felhasználó ugyanazt a gombot látja.
  3. **Sign in with Apple** az iOS-kiadás előtt kerül működésbe. A gomb már most elkészül, **csak iOS-en** látszik, és addig koppintásra „Hamarosan elérhető” üzenetet mutat.
  4. Regisztrációkor kötelező a **megjelenített név** és a **felhasználónév**; a **profilkép opcionális**, alapértelmezettként semleges sziluettel, amíg nincs arculat. A profilkeresőben (F4) **mindkét név alapján** lehet keresni.
     - A felhasználónév szabályai: 3–20 karakter; kisbetű, szám, pont és aláhúzás; egyedi (kis- és nagybetűtől függetlenül); egyelőre nem módosítható.
  5. A Home előtt **kötelező megadni az ízlést**; jelenleg ez a kézi választást jelenti.
  6. **Beállítások:** a saját profilról nyílik, **navbar nélkül**, egyszerű felülettel és bal felső visszanyíllal a profilra. Tartalma: kijelentkezés, téma- és nyelvváltó (D-002), fióktörlés, az ízlés módosítása (D-001).
  7. Regisztrációkor kötelező **elfogadni az adatvédelmi tájékoztatót** (a végleges szövegig helykitöltővel). **Fióktörlés** a Beállításokban.
  8. **E-mail-küldés:** a teszteléshez a Supabase beépített szolgáltatása; a saját e-mail-szolgáltatóra később visszatérünk.
  9. **Meg nem erősített e-mail-cím:** nem lehet vele belépni; belépési kísérletkor az app a kód beírására visz, és új kód kérhető. A felhasználónév és a profil csak a megerősítés után jön létre. A meg nem erősített regisztrációt **7 nap után automatikusan töröljük**.
  10. **Minimális életkor: 18 év**, egyszerű „Elmúltam 18 éves” jelölőnégyzettel, születési dátum nélkül (Q23 c). A jogi megfelelést a kiadás előtt jogásszal ellenőrizni kell.

---

## Elutasított javaslatok

_Még nincs._

---

## Megválaszolt nyitott kérdések

### Q1 — Név és azonosítók

- **Megválaszolva (2026-10-13):** Az app neve (munkacím): **Nocturnal**. iOS bundle identifier és Android package name: **`hu.nocturnal.app`** (az első store-feltöltés után nem változtatható). Logó még nincs; addig az Expo alapértelmezett ikonja a helykitöltő.

### Q2 — Backend

- **Megválaszolva (2026-10-13):** **Supabase**, EU (Frankfurt) régióval.
- **Lekérdezési réteg:** **Drizzle ORM**, egy Supabase Edge Functionben futó API-ban (`PHASE0.md`, 2.1 fejezet). Az app az adatokat ezen az API-n keresztül éri el; közvetlenül csak a belépéshez (Auth), az élő üzenetek fogadásához (Realtime) és a képfeltöltéshez (Storage) kapcsolódik a Supabase-hez.

### Q5 — Ízlés-algoritmus (részben)

- **Megválaszolva (2026-10-06):** Az előadók is számítanak, és közvetlenül befolyásolják az eseményajánlást (pl. a kedvenc előadó koncertje).
- **Még nyitott:** az „utóbbi idő” időablaka; a playlistek vagy a hallgatási előzmények számítsanak-e erősebben; az ízlésprofil frissítési gyakorisága.

### Q6 — Távolság (részben)

- **Megválaszolva (2026-10-06):** A keresési távolságot a felhasználó a **térképen egy csúszkával (slider)** állítja be (új felületi elem, kifejezetten jóváhagyva). A távolság a felhasználó aktuális pozíciójától számít, **legfeljebb 200 km**.
- **Csúszka értékei:** alapérték **25 km**, minimum **1 km**, maximum **200 km**, lépésköz **1 km**.
- A beállított távolság minden ajánlásra érvényes (Home rács és térkép is), az F1 szerint.

### Q21 — Navbar

- **Megválaszolva (2026-10-13):** Sorrend: balra a **csevegőtér**, középen a **Home**, jobbra a **profilkereső**. A belépés, regisztráció és szinkron képernyőkön **nincs navbar**, csak belépés után. Az első verzióra érvényes, később módosulhat.

### Q22 — Arculat és nyelv

- **Megválaszolva (2026-10-13):** Sötét és világos mód is lesz. A felület kétnyelvű (magyar és angol), elsősorban magyar. A részletek: D-002. Van egy kezdetleges Figma-terv, de egyelőre nem kiindulási alap. Logó és végleges arculat még nincs.

---

## Folyamat

### P-001 — A `main` ág védelme

- **Dátum:** 2026-10-13
- A repón ketten dolgoznak. A `main` ágra csak pull requesttel lehet bekerülni, **1 jóváhagyással**; a force push és az ág törlése tiltott, az adminokra is érvényes.
- A beállítást a repó adminja végzi a GitHubon (Settings → Rules → Rulesets), mert a GitHub CLI nincs telepítve, és a repó egy másik fiókhoz tartozik.
- A kötelező CI-ellenőrzés (typecheck, lint, tesztek) az 1. fázis CI-jának elkészülte után kerül a szabályba.

---

## Implementációs döntések

### I-001 — Projektalap (1. fázis, 2026-10-13)

- **Expo SDK 57** (a legfrissebb stabil; az SDK 58 béta), React Native 0.86, React 19.2, TypeScript 6, `strict: true`.
- Csomagkezelő: **npm**; Node.js 22 (`.nvmrc`). Új függőség csak `npx expo install`-lal kerül be.
- Az útvonalak a **`src/app`** mappában vannak (az SDK 57 sablonjának konvenciója); ez felülírja a `PHASE0.md` 5. fejezetében szereplő gyökérszintű `app/` mappát. Útvonal-alias: `@/*` → `src/*`.
- A `react-dom`, a `react-native-reanimated` és a `react-native-worklets` közvetlen függőségként, az SDK 57-tel kompatibilis verzióra rögzítve szerepel. Ezek az Expo Router függőségei; e nélkül az npm inkompatibilis, túl új verziót telepít.
- Egységes LF sorvégek (`.gitattributes`), mert a csapat Windowson is dolgozik.

### I-002 — Kódstílus

- A kódban az elnevezések **és a kommentek** angolul vannak; a dokumentáció (README, `docs/`) magyarul.
- A felületi szövegek a `src/i18n/locales` mappában vannak. A `hu.ts` a forrás; az `en.ts`-nek a TypeScript kikényszeríti, hogy ugyanazokat a kulcsokat tartalmazza.
- ESLint (`eslint-config-expo`) és Prettier (szimpla idézőjel, 100 karakteres sor). A Markdown-fájlokat a Prettier nem formázza.

### I-003 — Navigációs váz (F5, F6, F7)

- A gyökérben egy Stack van, `Stack.Protected` védelemmel: kijelentkezve csak az `(auth)` csoport, belépve a `(tabs)` csoport és a profil érhető el.
- A `(tabs)` csoportban pontosan 3 fül van: csevegőtér, Home, profilkereső (Q21). Mindegyik fülnek saját Stackje van, így a fülön belül megnyitott képernyőkön (pl. térkép, csevegőtér, beszélgetés) a navbar látható marad (F7).
- A profil (`profile/[id]`) a fülek fölött van, ezért ott nincs navbar (F4, F7). A saját profil azonosítója `me`.
- A Home a középső fül, mégis az a kezdőképernyő: ezt a `Tabs` `initialRouteName` beállítása biztosítja (F5, F6).
- Belépés: Belépés → Home; Regisztráció → Streaming-szinkron (→ kézi ízlésválasztás) → Home.
- Az eseményrácsban a koppintás még nem csinál semmit (Q8), a lezárt események menüpontja még nincs a navigációban (Q13).

### I-004 — Helykitöltő munkamenet

- A 2. fázisig a belépés helykitöltő: memóriában tárolt állapot (Zustand). Az app újraindítása után újra a belépő képernyő jelenik meg; kijelentkezés gomb még nincs.

### I-005 — Téma és nyelv (D-002 alapján)

- Helykitöltő színpaletta világos és sötét módra, amíg nincs végleges arculat. A téma a telefon beállítását követi (`userInterfaceStyle: automatic`); ha a telefon nem ad meg semmit, világos.
- A nyelvet a telefon elsődleges nyelve dönti el (`expo-localization`). Ha a telefon nem ad nyelvi adatot, magyar.
- A kézi téma- és nyelvváltó a Beállítások képernyővel együtt készül el.

### I-006 — Tesztelés

- Jest (`jest-expo`), React Native Testing Library 14 és `expo-router/testing-library`.
- Az RNTL 14-ben a `render` és a `fireEvent` aszinkron, ezért a tesztekben `await`-tel hívjuk őket.
- A navigációs tesztek az F4–F7 elfogadási feltételeit ellenőrzik: 3 navbar-elem sorrendben, belépés után a Home, a profilon nincs navbar, a térképen van, a Követés/Kikövetés gomb váltása.

### I-007 — CI és EAS

- GitHub Actions: `npm ci` → typecheck → lint → tesztek, minden pull requesten és a `main`-re küldött commitokon.
- Az `eas.json` három profilt tartalmaz (`development`, `preview`, `production`). Az EAS Update csatornái az `expo-updates` telepítésekor kerülnek be.
- **EAS-projekt (2026-10-13):** `@nocturnal_app/nocturnal` (azonosító: `17317d02-8a22-4d6d-a425-4b1bc7862d57`), a csapat **`nocturnal_app`** Expo-szervezetében, nem személyes fiókban, hogy mindkét fejlesztő hozzáférjen. A projektazonosító és az `owner` az `app.config.ts`-ben van (nem titok; a dinamikus konfigurációba az `eas init` nem tud automatikusan írni).

### I-008 — Backend és API (2. fázis, 2026-10-18)

- **Supabase CLI** fejlesztői függőségként; a `supabase/` mappa össze van kötve a projekttel (`ryqbsalvqwvamhrcliht`, Frankfurt). A `supabase/config.toml` a helyi környezetet írja le, és dokumentálja a távoli Auth-beállításokat; a távoli beállítások a Supabase felületén élnek, a CLI nem írja felül őket.
- **Migrációk:** a `drizzle-kit` generálja őket a `supabase/migrations` mappába (Supabase-formátumú fájlnevekkel); a tárhely és az időzített feladat kézzel írt SQL-migráció. Felküldés: `npm run db:push` (a CLI ideiglenes belépési szerepet használ, adatbázis-jelszó nem kell).
- **Séma:** `profiles` tábla (azonosító = auth-felhasználó, felhasználónév egyedi és formátum-ellenőrzött, megjelenített név, profilkép útvonala, a 18+ megerősítés és az adatvédelmi elfogadás időpontja, a tájékoztató verziója, az ízléslépés időpontja). **RLS bekapcsolva, szabályok nélkül**: az appból közvetlenül nem olvasható, csak az API-n át.
- **API:** egyetlen `api` Edge Function. A logika az `app.ts`-ben van (Hono), az `index.ts` csak összeköt. Hitelesítés: `@supabase/server` `withSupabase({ auth: 'user' })` — a Hono-adapterét nem használjuk, mert 2026. december 1-jén megszűnik. Adatbázis: Drizzle és postgres.js a `SUPABASE_DB_URL`-lel (`prepare: false`, legfeljebb 3 kapcsolat). Tárhely- és felhasználó-törlés: a `supabaseAdmin` kliens.
- **Fontos:** az új API-kulcsokkal a platform JWT-ellenőrzése a token nélküli kéréseket is továbbengedi a függvényig, ezért a hitelesítést a függvényben futó `withSupabase` végzi. Ellenőrizve: token nélkül és érvénytelen tokennel is 401.
- **Közös kód:** `supabase/functions/_shared` (zod-adatszerződések és a Drizzle-séma). Az app a `@shared/*` aliasszal éri el. A Deno a relatív importokban megköveteli a `.ts` kiterjesztést, ezért a tsconfigban `allowImportingTsExtensions: true`. A Deno-specifikus `index.ts` kimarad az app típusellenőrzéséből.
- **Profilképek:** privát `avatars` tárhely (legfeljebb 2 MB, JPEG). Feltöltés az API által kiadott, aláírt feltöltési címre, a `<felhasználó-azonosító>/<véletlen azonosító>.jpg` útvonalra; megjelenítés 1 óráig érvényes, aláírt címmel. A telefonon 512 pixel szélesre kicsinyítve, JPEG-ként.
- **Adatvédelmi tájékoztató verziója:** `draft-2026-10`, az elfogadással együtt tárolva; a szöveg változásakor emelni kell.
- **Meg nem erősített regisztrációk:** `pg_cron` feladat naponta 03:00-kor (UTC) törli a 7 napnál régebbieket.

### I-009 — Belépés az appban (2. fázis)

- `supabase-js` **PKCE**-folyamattal. A munkamenet titkosítva tárolódik: az AES-kulcs a SecureStore-ban (Keychain / Keystore), a titkosított munkamenet az AsyncStorage-ban, mert a munkamenet nagyobb lehet a SecureStore méretkorlátjánál. A tokenfrissítés csak előtérben fut.
- **Állapotgép** (`resolveAppState`): betöltés → kijelentkezve → profil kell → ízlés kell → kész, valamint „nem elérhető”. A gyökér-Stack `Stack.Protected` szabályai ebből döntenek; a splash képernyő addig látszik, amíg az állapot ki nem derül. Hidegindításkor a közvetlen linkek a Home-on kötnek ki, mert a munkamenet aszinkron töltődik.
- **Jelszó-visszaállítás:** a kód ellenőrzése már bejelentkezteti a felhasználót, ezért egy jelző a belépő folyamatban tartja, amíg az új jelszó el nem mentődik; ha a mentés nem sikerül, kijelentkeztetjük.
- **Google (böngészős):** `signInWithOAuth` → `WebBrowser.openAuthSessionAsync` → `exchangeCodeForSession`. A visszairányítási cím `Linking.createURL('auth/callback')` (Expo Go-ban `exp://…`); a `+native-intent` a gyökérre irányítja, ha Android deep linkként is kézbesíti.
- **Kijelentkezés:** csak ezen az eszközön (`scope: 'local'`). A profil létrehozása képernyőn is van kijelentkezés link, mert a beléptetés közben a Beállítások még nem érhető el (pl. ha valaki rossz Google-fiókkal lépett be).
- **„Nem elérhető” képernyő:** ha bejelentkezés után a profil nem tölthető be (pl. nincs internet), Újra és Kijelentkezés gombbal. Ez hibakezelés, nem új funkció.
- **Téma és nyelv** (D-002): eszközönként tárolva (Zustand + AsyncStorage); a „Rendszer” a telefont követi.
- **E-mail-sablonok:** kétnyelvűek (elöl magyar, alatta angol), mert a sablon a nyelvi adat hiányában nem tud megbízhatóan nyelvet váltani. A fájlok: `supabase/templates/`.
- **Engedélykérő szövegek:** az `app.config.ts`-ben angolul, iOS-re magyar fordítással (`src/i18n/native/hu.json`). Ezek csak saját buildben látszanak; az Expo Go a saját szövegeit mutatja.

### I-010 — Tesztelés (2. fázis)

- Az API tesztjei hamis adatbázissal és tárhellyel futnak (Hono `app.request`), valódi szerver nélkül.
- Az app folyamattesztjei hamis Supabase- és API-réteggel futnak: belépés, hibás jelszó, meg nem erősített e-mail, regisztráció kóddal, profil létrehozása, a 18+ nélküli tiltás, a kötelező ízléslépés, a navbar, a profilok, a Beállítások, a kijelentkezés és a nyelvváltás.
- Összesen 47 teszt; mellette `expo export` iOS-re és Androidra, valamint `expo-doctor`.
