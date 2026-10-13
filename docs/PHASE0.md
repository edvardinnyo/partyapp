# 0. fázis — Felderítés és architektúra-javaslat

**Dátum:** 2026-10-06 (frissítve: 2026-10-13) · **Állapot:** jóváhagyásra vár · Kód még nem készült. A megválaszolt kérdések a `DECISIONS.md`-ben vannak.

Tartalom:
1. Ellenőrzött külső tények (2026. október)
2. Backend-összehasonlítás és ajánlás (Q2)
   - 2.1 Lekérdezési réteg: ORM
3. Térkép-összehasonlítás
4. Könyvtárlista
5. Mappaszerkezet
6. Adatmodell (véglegesítendő)
7. Ízlés-algoritmus terve
8. Esemény-életciklus terve
9. Költségek összesítve
10. Nyitott kérdések (csoportosítva)
11. Javaslatok (jóváhagyásra várnak)

---

## 1. Ellenőrzött külső tények (2026. október)

| Téma | Állapot | Hatás ránk |
|---|---|---|
| **Expo SDK** | Az SDK 57 (React Native 0.86, 2026. június 30.) a legfrissebb stabil verzió. Az SDK 58 2026. szeptember 15. óta bétában van. | Az SDK 57-tel indulunk. A CLAUDE.md még az SDK 56-ot említi. Az 58-ra a stabil kiadás után, külön `chore/` ágon frissítünk. |
| **Spotify, Development Mode** | Megerősítve: legfeljebb 5 felhasználó appanként, az app tulajdonosának Premium-előfizetés kell. 2026. július 23. óta fejlesztőnként 25 Client ID hozható létre, de ezek egy közös, fiókszintű kvótán osztoznak. | A korlát nem kerülhető meg több app létrehozásával. A D-001 (kézi választás) ezért fontos. |
| **Spotify, a 2026. februári API-változások** | Megszűntek a tömeges lekérések (`/artists?ids=`), az előadó top számai végpont és a `GET /users/{id}`. Eltűnt a `popularity` és a `followers` mező. Playlist-tartalom csak a saját vagy közös playlistekből kérhető le. A keresés legfeljebb 10 találatot ad. | Ugyanez áll a CLAUDE.md 7. fejezetében is. Új információ a keresés 10 találatos korlátja, de azt nem használjuk. A `/me/top`, a `/me/player/recently-played` és a `/me/playlists` továbbra is elérhető. |
| **App Store 4.8** | Ha az app Google-belépést kínál, kell egy egyenértékű, adatvédelmi feltételeknek megfelelő alternatíva is. A gyakorlatban ez a Sign in with Apple. | A Q20-hoz: **a Sign in with Apple nélkül nagy eséllyel elutasítják az appot.** |
| **Apple Music, katalógus** | A katalógusban keresés (előadók, számok, műfajnevek) csak developer tokent igényel, felhasználói előfizetést nem. A token a backenden készül, a MusicKit kulcsával aláírva. | A D-001 szerinti előadó- és zenekereséshez **nem kell natív modul**: a backend végzi a keresést, Androidon is ugyanígy működik. |

Források: [Expo SDK 57](https://expo.dev/changelog/sdk-57), [Expo changelog](https://expo.dev/changelog), [Spotify 2026. februári migrációs útmutató](https://developer.spotify.com/documentation/web-api/tutorials/february-2026-migration-guide), [TechCrunch — Spotify Developer Mode](https://techcrunch.com/2026/02/06/spotify-changes-developer-mode-api-to-require-premium-accounts-limits-test-users/), [Spotify API-változások összefoglalója](https://vorplabs.com/agent-tools/spotify-api-changes), [Apple Developer Forums — 4.8](https://developer.apple.com/forums/thread/765145), [MusicKit dokumentáció](https://developer.apple.com/documentation/musickit), [Supabase-árazás 2026](https://makerkit.dev/blog/saas/supabase-pricing).

---

## 2. Backend-összehasonlítás és ajánlás (Q2)

Szükséges képességek: hitelesítés (email, Google és várhatóan Apple), térbeli lekérdezés (távolság szerinti szűrés), valós idejű csevegés, képtárolás, időzített feladatok (esemény-lezárás), szerveroldali titkok (Spotify-tokencsere, Apple Music developer token).

| Szempont | **Supabase** | **Firebase** | **Saját Node.js backend** |
|---|---|---|---|
| Adatbázis | Postgres (relációs) | Firestore (dokumentum) | Tetszőleges (pl. Postgres) |
| Távolság szerinti szűrés | **PostGIS** `ST_DWithin`: pontos, indexelt, egyetlen lekérdezés | Nincs natív támogatás: geohash és kliensoldali utószűrés kell (geofire-common) | PostGIS, de mindent magunk építünk |
| Követés, hírfolyam, keresés | Természetes SQL (JOIN, `ILIKE`, trigram index a részleges névkereséshez) | Denormalizálás kell. A részleges szöveges keresés nem megy külső kereső (pl. Algolia) nélkül. | SQL, magunk írjuk |
| Valós idejű csevegés | Supabase Realtime (Postgres-változások, broadcast) | Kiváló (Firestore listener) | WebSocket-szerver, magunk üzemeltetjük |
| Képtárolás | Storage, hozzáférési szabályokkal és képátméretezéssel | Cloud Storage | S3 vagy hasonló, magunk kötjük be |
| Hitelesítés | Email, Google és Apple beépítve | Email, Google és Apple beépítve | Magunk építjük vagy külső szolgáltatás |
| Időzített feladatok | `pg_cron` az adatbázisban | Cloud Scheduler és Functions | cron, magunk üzemeltetjük |
| Szerveroldali logika | Edge Functions (TypeScript, Deno) | Cloud Functions (TypeScript, Node) | Teljes szabadság |
| Jogosultságkezelés | Row Level Security (SQL-szabályok) | Security Rules | Magunk írjuk |
| EU-s adattárolás (GDPR) | Igen (pl. Frankfurt régió) | Igen (EU-régiók) | Igen, a hostingtól függ |
| Kötődés a szolgáltatóhoz | Kicsi: nyílt forráskódú, Postgres bármikor elvihető | Nagy: Firestore-specifikus adatmodell | Nincs |
| Fejlesztési idő | **Legkevesebb** | Közepes (a geo és a keresés kerülőutas) | **Legtöbb** (üzemeltetés, skálázás, biztonság) |
| Költség induláskor | Free: 0 USD, de egy hét inaktivitás után leáll, élesre nem való. **Pro: 25 USD/hó**, benne 500 egyidejű realtime-kapcsolat; reálisan kb. 25–40 USD/hó. | Spark: 0 USD. Blaze: használat szerint fizetős, a Functions-höz kell; induláskor jellemzően 0–25 USD/hó. Kiszámíthatatlanabb, mert olvasásonként számláz. | VPS kb. 10–40 EUR/hó, plusz tárhely, plusz jelentősen több fejlesztési és üzemeltetési munka |

### ✅ Ajánlás: Supabase (EU, Frankfurt régió)

**Indoklás:**
- A legfontosabb üzleti logikánk, a távolságon belüli ajánlás, PostGIS-szel egyetlen indexelt lekérdezés. Firebase-en ez kerülőút lenne.
- A követés, a hírfolyam, a névkeresés és a látogatási statisztikák (legtöbbet látogatott, legjobban értékelt, legutóbbi hely) relációs adatok, SQL-ben egyszerűek.
- Egy helyen van minden, amire szükségünk van: Auth, Realtime, Storage, cron és Edge Functions.
- Az EU-s adattárolás segít a GDPR-megfelelésben.
- Kicsi a kötődés a szolgáltatóhoz: ha egyszer kinőjük, a Postgres-adatbázis elvihető.

**Kockázat:** 500 egyidejű realtime-kapcsolat felett vagy nagy képforgalomnál nő a költség. Ez a növekedéssel együtt kezelhető.

### 2.1 Lekérdezési réteg: ORM (2026-10-13)

**Kiindulás:** a Q2 jóváhagyásakor azt kérted, hogy a lekérdezések Prismában vagy hasonló könyvtárban készüljenek.

**Következmény az architektúrára:** ORM (Prisma, Drizzle) csak szerveren futhat, az appban nem. Az ORM közvetlenül az adatbázishoz kapcsolódik, ehhez az adatbázis jelszava kell. Ha ez az appba kerülne, bárki kiolvashatná, és minden adathoz hozzáférne. Az ORM ezért egy API-réteget jelent az app és az adatbázis között:

```
App ──HTTPS──▶ API (Supabase Edge Function, TypeScript + ORM) ──▶ Postgres (PostGIS)
App ──supabase-js──▶ csak: belépés (Auth), élő üzenetek fogadása (Realtime), képfeltöltés (Storage)
```

- Minden adatolvasás és -írás az API-n keresztül megy. Itt van az üzleti logika és a jogosultság-ellenőrzés, TypeScriptben, egységtesztelhetően.
- Az adatbázisban a Row Level Security alapból mindent tilt. Szabály csak ott van, ahol az app közvetlenül csatlakozik (Realtime, Storage).
- Az élő üzenetek fogadása (F2 csevegőtér, F4 beszélgetések) továbbra is Supabase Realtime-mal megy, mert az ORM-ek nem kezelnek valós idejű feliratkozást.
- Az API egyetlen Edge Function, belső útválasztással (a Supabase ezt ajánlja a hidegindítások csökkentésére). Az app és az API közös, zod-alapú adatszerződéseket használ.
- Ára: több kód, mert minden adatművelethez egy API-végpont kell. Cserébe a logika egy helyen van, és nem szétszórva SQL-függvényekben.

| Szempont | Prisma 7 (stabil, 7.10) | Prisma 8 (release candidate) | **Drizzle** (stabil 0.45, 1.0 RC) | ORM nélkül: supabase-js + generált típusok (eredeti terv) |
|---|---|---|---|---|
| Fut a Supabase Edge Functionben (Deno)? | Hivatalosan nem: a Deno-támogatás „not yet” | A Node, a Bun és a Cloudflare Workers támogatott; a Deno nincs említve | **Igen, a Supabase dokumentációjában szerepel** | Igen (az appban is) |
| Távolságszűrés (PostGIS) | Nincs natív támogatás: `Unsupported` típus és nyers SQL | Igen, `@prisma/orm-extension-postgis` (`dwithin`, `distance` stb.) | `geometry` oszloptípus, a távolságszűrés típusos `sql` segéddel | Postgres-függvény (RPC) |
| RLS-szabályok a sémában | Nem (külön SQL) | Igen (`@@rls`) | Igen (`pgPolicy`, Supabase-segédekkel) | Külön SQL |
| Érettség | Nagyon érett | 2026-10-12-én jelent meg RC-ként, teljes újraírás; végleges kiadás „az év végére” várható | Érett, széles körben használt; az 1.0 RC állapotban | A Supabase ajánlott módja |
| Ha nem fut Edge Functionben | Külön Node-szerver kell: plusz hosting (kb. 5–20 USD/hó) és üzemeltetés | Ugyanaz | — | — |
| Fejlesztői élmény | Olvasható séma, Prisma Studio | Hasonló, új „data contract” formátum | SQL-hez közeli TypeScript, Drizzle Studio | Legkevesebb kód, de a bonyolult logika SQL-függvényekbe kerül |

**✅ Ajánlás: Drizzle ORM, Supabase Edge Functionben futó API-val.**
- Ez az egyetlen ORM, amely a Supabase dokumentációja szerint fut az Edge Functionben. Így nem kell külön szerver, és a Supabase-csomagon belül maradunk.
- A PostGIS-távolságszűrés és az RLS-szabályok is TypeScriptben, egy helyen vannak.
- A Prisma 7-tel a legfontosabb lekérdezésünk (távolságszűrés) nyers SQL lenne, és külön Node-szerver kellene. A Prisma 8 mindent tudna, de egy induló projektet nem építenék egy napja megjelent RC-re.
- **Kockázat:** a Drizzle 1.0 még RC. A stabil 0.45-tel kezdünk; az 1.0-ra frissítés kis munka, külön `chore/` ágon.
- **Költség:** az Edge Function-hívások a Supabase Pro csomag havi keretén belül (kb. 2 millió hívás) nem kerülnek pluszba.

Jóváhagyás esetén a 4. (könyvtárlista) és az 5. (mappaszerkezet) fejezetet ennek megfelelően frissítem. Új elemek: `drizzle-orm`, `drizzle-kit`, `postgres` (postgres.js), `hono` (útválasztás az Edge Functionben) és a közös `zod`-szerződések.

Források: [Prisma 8 bejelentés](https://www.prisma.io/blog/prisma-orm-8-closes-330-most-requested-issues), [Prisma v7 — edge-futtatás](https://www.prisma.io/docs/orm/v7/prisma-client/deployment/edge/overview), [Supabase — Edge Functions és Postgres](https://supabase.com/docs/guides/functions/connect-to-postgres), [Drizzle — RLS](https://orm.drizzle.team/docs/rls), [Drizzle — PostGIS](https://orm.drizzle.team/docs/guides/postgis-geometry-point). Verziók az npm-ről (2026-10-13): `drizzle-orm` 0.45.4 (1.0.0-rc.5), `@prisma/client` 7.10.0, `prisma` 8.0.0-rc.22.

---

## 3. Térkép-összehasonlítás

| Szempont | **react-native-maps** | **Mapbox (@rnmapbox/maps)** |
|---|---|---|
| Térképmotor | iOS: Apple Maps; Android: Google Maps | Saját, mindkét platformon azonos |
| Költség | Ingyenes. Az Android Maps SDK natív mobilos használata nem fizetős, csak API-kulcs kell hozzá. | Ingyenes keret, utána havi aktív felhasználó alapú díj |
| Megjelenés | Platformonként kissé eltér; stílus Androidon JSON-nal, iOS-en korlátozottan | Teljesen egyedi stílus, mindkét platformon egyforma |
| Egyedi jelölők, színek | Igen (ez kell az ajánlott és a többi esemény eltérő színéhez) | Igen |
| Expo-kompatibilitás | Development builddel jól támogatott | Config pluginnal, development builddel |

**Ajánlás: react-native-maps.** Ingyenes, megbízható, és minden igényt lefed, ami a koncepcióban szerepel. A Mapbox akkor érné meg, ha egyedi, márkához igazított térképstílus kellene (ez a Q22-vel, az arculattal függ össze).

---

## 4. Könyvtárlista

Minden az Expo SDK 57-tel kompatibilis verzióban, `npx expo install`-lal telepítve.

| Terület | Könyvtár | Megjegyzés |
|---|---|---|
| Alap | `expo`, `expo-router`, `typescript` | Egyelőre Expo Go (D-003); az `expo-dev-client` később kerül be |
| Backend-kliens (app) | `@supabase/supabase-js` | Csak Auth, Realtime és Storage (2.1) |
| API (szerver) | `hono` | Útválasztás az Edge Functionben (2.1) |
| Adatbázis-réteg (szerver) | `drizzle-orm`, `drizzle-kit`, `postgres` | Az Edge Functionben fut (2.1, Q2 ✅) |
| Szerveradat | `@tanstack/react-query` | Gyorsítótár, lapozás (hírfolyam, chat) |
| Kliensállapot | `zustand` | |
| Validáció | `zod` | Közös adatszerződések az app és az API között, űrlapok ellenőrzése |
| Biztonságos tárolás | `expo-secure-store` | Munkamenet és tokenek. A Supabase-munkamenet nagyobb lehet a SecureStore méretkorlátjánál, ezért titkosított tárolást használunk, a kulccsal a SecureStore-ban. |
| Google-belépés | `@react-native-google-signin/google-signin` | Natív, Supabase `signInWithIdToken` |
| Apple-belépés | `expo-apple-authentication` | Csak ha a Q20-ban jóváhagyod |
| Spotify OAuth (PKCE) | `expo-auth-session`, `expo-crypto` | A tokencsere a backend Edge Function-ben történik, a client secret soha nem kerül az appba. |
| Apple Music katalógus | Nincs kliens-könyvtár | Backend Edge Function, developer tokennel (lásd 1. fejezet) |
| Helyadat | `expo-location` | Csak előtérbeli; háttérbeli helyadatot csak a Q19 jóváhagyása után kérünk |
| Térkép | `react-native-maps` | |
| Távolság-csúszka | `@react-native-community/slider` | |
| Kamera, képek | `expo-image-picker` (és ha kell, `expo-camera`) | A Q11-től függ |
| Képmegjelenítés | `expo-image` | Gyorsítótárazás |
| Képtömörítés feltöltés előtt | `expo-image-manipulator` | |
| Animáció („neuron”) | `react-native-reanimated` és `react-native-svg` | Ha ez nem elég gördülékeny, `@shopify/react-native-skia` |
| Szövegek egy helyen | `i18next` és `react-i18next` | Akkor is, ha csak magyar lesz a felület (Q22), mert a szövegek így egy helyen vannak. |
| Tesztelés | `jest`, `jest-expo`, `@testing-library/react-native` | |
| Kódminőség | ESLint (`eslint-config-expo`), Prettier | |

---

## 5. Mappaszerkezet

```
partyapp/
├─ app/                          # Expo Router képernyők (csak útvonalak, vékony réteg)
│  ├─ _layout.tsx                # gyökér: providerek, auth-átirányítás
│  ├─ (auth)/                    # F6: belépés, regisztráció, szinkron, kézi ízlés
│  ├─ (tabs)/                    # F7: navbar 3 elemmel
│  │  ├─ _layout.tsx
│  │  ├─ chats/                  # F2: csevegőterek listája és egy esemény csevegőtere
│  │  ├─ index.tsx               # F5: Home
│  │  └─ search/                 # F4: profilkereső, hírfolyam, beszélgetések
│  ├─ profile/[id].tsx           # F4: profil (navbar nélkül)
│  ├─ settings/                  # D-001: Beállítások (ízlés módosítása)
│  └─ map.tsx                    # F5: térkép, távolság-csúszkával
├─ src/
│  ├─ features/                  # funkciónként: komponensek, hookok, API-hívások
│  │  ├─ auth/  taste/  events/  chat/  looking-for/  profile/  social/  map/
│  ├─ domain/                    # tiszta üzleti logika, UI és hálózat nélkül (egységtesztelt)
│  │  ├─ taste/                  # ízlés-algoritmus, súlyok konfigurációja
│  │  ├─ recommendation/         # esemény-pontozás
│  │  ├─ geo/                    # távolság-számítás
│  │  └─ event-lifecycle/        # esemény-állapotok
│  ├─ lib/                       # supabase-kliens, query-kliens, tároló
│  ├─ components/                # közös UI-elemek
│  ├─ i18n/                      # felületi szövegek
│  └─ theme/                     # színek, betűk (Q22)
├─ supabase/
│  ├─ migrations/                # a drizzle-kit által generált migrációk (séma, RLS, pg_cron)
│  └─ functions/
│     ├─ api/                    # az egyetlen API Edge Function (Hono útválasztás)
│     └─ _shared/db/             # Drizzle-séma, közös az API és a drizzle-kit között
├─ docs/  DECISIONS.md, PHASE0.md
├─ app.config.ts  eas.json  .env.example
└─ .github/workflows/ci.yml
```

A `domain/` mappa szándékosan független a Reacttól és a Supabase-től. Így az ízlés-algoritmus, a távolságszűrés és az esemény-életciklus (a kötelező egységtesztek tárgyai) könnyen tesztelhetők.

---

## 6. Adatmodell (véglegesítendő)

Postgres-táblák a Supabase-ben. A ❓ a nyitott kérdéstől függő részeket jelöli.

| Tábla | Fő mezők | Megjegyzés |
|---|---|---|
| `profiles` | id (= auth user), display_name, username ❓, avatar_url, created_at | Q20 |
| `user_settings` | user_id, search_radius_km (1–200, alapérték 25) | Q6 ✅ |
| `streaming_connections` | user_id, provider, refresh_token (titkosítva, csak a backend olvashatja), scopes, last_synced_at | Q4 |
| `genres` | id, name (megjelenített), slug | Közös műfaj-taxonómia a felhasználóknak és az eseményeknek, kb. 15–25 tétel (Q3) |
| `genre_aliases` | alias (pl. „hungarian techno”), genre_id | A streaming-szolgáltatások műfajneveinek leképezése a taxonómiára |
| `taste_manual_genres` | user_id, genre_id | D-001: 3–10 db |
| `taste_manual_artists` | user_id, apple_music_artist_id, name, genre_ids | D-001: legfeljebb 20 |
| `taste_manual_tracks` | user_id, apple_music_song_id, title, artist_name, genre_ids | D-001: legfeljebb 20 |
| `taste_profiles` | user_id, top_genres (3 db, pontszámmal), all_genre_scores, favorite_artists (normalizált nevek), sources, computed_at | Az algoritmus kimenete |
| `artist_genre_cache` | provider, artist_id, genres, fetched_at | A Spotify egyesével lekérhető előadóihoz |
| `venues` | id, name, type (club / bar / concert_venue / festival), location (PostGIS `geography`), address | Q3 |
| `events` | id, venue_id, title, starts_at, ends_at, genre_ids, artist_names, cover_image_url, closed_at | Q3, Q12. Az állapot az időpontokból számolódik (8. fejezet). |
| `chat_messages` | id, event_id, user_id, body, image_path, mentioned_user_ids ❓, created_at | Q10, Q11 |
| `looking_for_posts` | id, event_id, user_id, body, image_path ❓, created_at | Q14 |
| `looking_for_replies` | id, post_id, user_id, body, created_at | Q14 |
| `posts` | ❓ | Lehet, hogy azonos a `looking_for_posts`-szal (Q15) |
| `follows` | follower_id, followee_id, created_at | |
| `conversations`, `conversation_members`, `direct_messages` | | Q16 |
| `visits` | user_id, venue_id, event_id, visited_at, source ❓ | Q17 |
| `ratings` | user_id, venue_id, value ❓ | Q17 |

Barátok helye a térképen: a Q19 döntéséig semmilyen adatot nem tárolunk róla.

---

## 7. Ízlés-algoritmus terve

Minden súly és küszöb egyetlen konfigurációs fájlban van (`src/domain/taste/config.ts`, a backenden ennek tükre). Az algoritmus determinisztikus: ugyanarra a bemenetre mindig ugyanazt adja, holtversenynél a műfaj azonosítója dönt.

### 7.1 Közös forma

Minden adatforrás (Spotify, kézi választás, később esetleg Apple Music vagy Last.fm) ugyanazt adja vissza:

```
Signal = { artistName, genres: string[], weight: number }
```

Ebből az algoritmus két dolgot számol: **műfajpontszámokat** és a **kedvenc előadók listáját**.

### 7.2 Streaming (Spotify) forrás — javasolt súlyok (a Q5 maradék része)

| Adat | Súly | Indoklás |
|---|---|---|
| Top előadók, `short_term` (kb. 4 hét) | 1.0 | Ez áll a legközelebb az „On Repeat”-hez és a havi rendszerességhez |
| Top számok előadói, `short_term` | 0.8 | |
| Top előadók, `medium_term` (kb. 6 hónap) | 0.5 | Stabilitást ad |
| Legutóbb lejátszott számok előadói | 0.4 | |
| Saját playlistek előadói | 0.3 | Ezek gyakran régiek, ezért gyengébb jelzésnek számítanak |

A listán elfoglalt hely is számít: az 1. helyezett teljes súlyt kap, az utolsó kb. a felét (lineárisan csökken).

### 7.3 Kézi forrás (D-001)

| Adat | Súly |
|---|---|
| Kiválasztott műfaj | 1.0 műfajonként |
| Kiválasztott előadó műfajai (Apple Music katalógusból) | 0.6 |
| Kiválasztott zene műfajai (Apple Music katalógusból) | 0.4 |

### 7.4 Lépések

1. **Műfaj-normalizálás:** a szolgáltatások műfajneveit (pl. „hungarian techno”, „Dance”) a `genre_aliases` táblával és kulcsszó-szabályokkal leképezzük a közös taxonómiára. Ami nem képezhető le, azt figyelmen kívül hagyjuk és naplózzuk (érzékeny adat nélkül), hogy a táblát bővíteni lehessen.
2. **Hiányos adat:** ha egy előadónak nincs műfaja (a Spotifynál gyakori), csak a kedvenc előadók listájába kerül be, a műfajpontszámba nem. Az app nem omlik össze.
3. **Forrásonkénti összegzés és normalizálás:** a műfajpontszámokat forrásonként összeadjuk, majd 1-re normalizáljuk.
4. **Keverés (D-001):** ha mindkét forrás van, `végső = 0.5 × kézi + 0.5 × streaming`. Ha csak az egyik van, az 100%-ot kap.
5. **Top 3:** a három legmagasabb pontszámú műfaj. Ha a streaming-adatokból 3-nál kevesebb műfaj jön ki és nincs kézi választás, az app felajánlja a kézi választást.
6. **Kedvenc előadók:** a kézi előadók és a streaming top előadói, normalizált névvel (kisbetű, ékezet és írásjelek nélkül). Erre azért van szükség, mert az Apple Music és a Spotify azonosítói eltérnek, és az eseményeknél is név alapján tudunk egyeztetni.

### 7.5 Eseményajánlás

Egy esemény akkor ajánlott, ha:
- a felhasználó beállított távolságán belül van (PostGIS `ST_DWithin`, az aktuális pozícióhoz mérve), **és**
- a pontszáma eléri a küszöböt.

A pontszám képlete: `pontszám = Σ (az esemény műfajainak pontszáma a felhasználó top 3 műfajában) + előadó-bónusz`.

- Az **előadó-bónusz** (Q5 ✅): ha az esemény fellépői között van a felhasználó egyik kedvenc előadója, az esemény nagy bónuszt kap, és műfajegyezés nélkül is ajánlott lesz.
- A sorrend a Q7-től függ. Javaslat: pontszám szerint csökkenő, holtversenynél a kezdés időpontja szerint.

### 7.6 Frissítés (javaslat, a Q5 maradék része)

- **Streaming:** naponta egyszer automatikusan (backend, `pg_cron` és Edge Function), valamint az app megnyitásakor, ha az utolsó számítás 24 óránál régebbi.
- **Kézi:** azonnal, mentéskor.

---

## 8. Esemény-életciklus terve

```
közelgő  ──(starts_at)──▶  éppen zajló  ──(ends_at + türelmi idő)──▶  lezárt
                            [F2 csevegőtér]                            [F3 „keresek egy embert”]
```

- Az állapot **az időpontokból számolódik**, így nem fordulhat elő, hogy egy esemény „beragad” egy állapotban.
- Egy `pg_cron` feladat 5 percenként beállítja a `closed_at` mezőt a lezáródó eseményeken. Ez indítja el a lezáráskori teendőket (a csevegőtér zárása, archiválás vagy törlés a Q12 szerint).
- Az **esemény fejléce** (F2): egy adatbázis-trigger a legutóbbi képes üzenet képét az esemény `cover_image_url` mezőjébe írja.
- A türelmi idő (lezárás után még hány percig él a csevegőtér), az archívum sorsa és a „keresek egy embert” részben maradás ideje: **Q12**.
- Az egységtesztek a határeseteket fedik le: pontosan kezdéskor és záráskor, éjfélen átnyúló esemény, időzónák (az adatbázisban minden UTC, a megjelenítés helyi idő szerint).

---

## 9. Költségek összesítve (becslés, induló szakasz)

| Tétel | Költség | Mikor kell? |
|---|---|---|
| Supabase Pro | kb. 25–40 USD/hó | A béta-tesztelés kezdetétől (a Free csomag fejlesztésre elég) |
| Apple Developer Program | 99 USD/év | iOS-kiadás, TestFlight, Apple Music katalógus |
| Google Play Developer | 25 USD egyszeri | Android-kiadás |
| Expo EAS | Free csomag (korlátozott build-szám) vagy Starter kb. 19 USD/hó | A Free fejlesztésre általában elég |
| Spotify | 0 USD, de az app tulajdonosának Premium kell | Spotify-integráció |
| Google Maps (Android) | 0 USD natív mobilos használatra, API-kulcs kell | Térkép |

---

## 10. Nyitott kérdések (csoportosítva)

A ✅ jelöli a már megválaszoltakat (lásd `DECISIONS.md`). A **⛔** jelöli azokat, amelyek az 1. fázis (projektváz) **előtt** kellenek. A többi a saját fázisa előtt elég.

### A) Az 1. fázis előtt
- **⛔ Q1 — Név és azonosítók:** az app neve? Az iOS bundle identifier és az Android package name (pl. `hu.nocturnal.app`)? Van ikon vagy logó? A mappa neve alapján a „Nocturnal” a munkacím?
- **⛔ Q2 — Backend:** jóváhagyod a Supabase-t (EU régió)?
- **⛔ Q21 — Navbar:** melyik oldalon legyen a csevegőtér, és melyiken a profilkereső? Javaslat: balra a csevegőtér, középen a Home, jobbra a profilkereső, ahogy az 5. fejezet ábrája mutatja. A belépés, regisztráció és szinkron képernyőkön legyen navbar? Javaslat: nem, csak belépés után, mert előtte nincs hova navigálni.
- **⛔ Q22 — Arculat és nyelv:** van Figma-terv, színek, betűtípus? Sötét vagy világos mód (vagy mindkettő)? Csak magyar a felület, vagy több nyelv?
- **Új — GitHub:** a repó már a GitHubon van? A `main` ág védelmét (branch protection) beállítsam, vagy te állítod be?

### B) Események, ajánlás (4. fázis előtt) — **a legkritikusabb**
- **Q3 — Esemény- és helyszínadatok forrása:** honnan jönnek az események? Lehetőségek: (a) mi töltjük fel kézzel egy egyszerű admin-felületen vagy közvetlenül az adatbázisba; (b) szervezők töltik fel (ez új felület, termékdöntés); (c) külső forrás (pl. Facebook-események, Resident Advisor, jegyértékesítők). Ezek többségének nincs nyilvános API-ja, ezt külön meg kell vizsgálni. Melyik városban indulunk (Budapest?)? Ki és hogyan rendel műfajt és előadókat egy eseményhez?
- **Q5 maradék része:** jóváhagyod a 7.2 (súlyok) és a 7.6 (frissítés) javaslatait?
- **Q7 — A rács tartalma:** csak az éppen zajló események, vagy a közelgők is (ma este, hétvégén)? Sorrend: a 7.5 javaslata megfelel?
- **Q8 — Eseményre koppintás:** mi nyílik meg (eseményoldal?), és milyen adatok látszanak (helyszín, időpont, műfajok, fellépők, fejléckép)?
- **Új — Mit mutat a térkép?** Az F5 szerint „az összes eseményt”. Ez a beállított távolságon belüli összes eseményt jelenti, vagy tényleg mindet, a távolságtól függetlenül?
- **Q19 — Barátok a térképen:** része az első verziónak? Ha igen: önkéntes (opt-in), valós idejű vagy utolsó ismert hely, és ki láthatja?

### C) Belépés és szinkron (2–3. fázis előtt)
- **Q20 — Belépési módok:** felvegyük a Sign in with Apple-t? Az 1. fejezet szerint nélküle nagy eséllyel elutasítják az appot. Milyen adatok kellenek regisztrációkor: név, felhasználónév (egyedi @név?), profilkép? Melyik kötelező?
- **Q4 maradék része:**
  - A Spotify maradjon az első verzióban (zárt béta 5 fővel, a kód kész az Extended Quota Mode-ra)?
  - Az Apple Music **felhasználói szinkronként** is legyen (heavy rotation, előzmények)? Ez natív modult és Apple Music-előfizetést igényel a felhasználónál. Vagy egyelőre csak a katalógusban kereséshez használjuk (D-001)?
  - A YouTube Music kimarad (nincs hivatalos API)?
  - Last.fm?
  - A kezdéshez kötelező a streaming-szinkron **vagy** a kézi választás közül legalább az egyik? Javaslat: igen, mert ízlés nélkül nincs mit ajánlani.
- **Új — Beállítások:** a D-001 szerint a saját profilon lesz egy Beállítások menüpont. Kerülhet ide a **kijelentkezés** (az F6 előírja, de nincs a helye kijelölve), a streaming-fiók összekötése vagy leválasztása, és a Q23 jóváhagyása esetén a fióktörlés?

### D) Csevegőterek (5. fázis előtt)
- **Q9 — Hozzáférés:** csak a fizikailag ott lévők léphetnek be vagy oszthatnak meg képet (helyalapú ellenőrzés)? Beléphet-e valaki egy nem neki ajánlott esemény csevegőterébe?
- **Q10 — „Linkelni emberekkel”:** @-említés, profil megosztása, vagy követés közvetlenül a csevegőből?
- **Q11 — Képek forrása:** csak az appon belüli kamera, vagy a galéria is? (A „valós idejű, bentről” cél miatt a kamera indokolt lehet.)
- **Q12 — Lezárás:** mennyi a türelmi idő a zárás után? Mi lesz a csevegőtér tartalmával (olvasható archívum vagy törlés)? Meddig marad az esemény a „keresek egy embert” részben?

### E) Lezárt események (6. fázis előtt)
- **Q13 — Hely a navigációban:** a navbar 3 elemű. Hol érhető el a lezárt események / „keresek egy embert” menüpont? Például a csevegőtér képernyőn egy „Éppen zajló / Lezárt” váltóval, vagy a Home-ról?
- **Q14 — Bejegyzés és reakció:** szöveg, vagy szöveg és kép? A „reagálás” hozzászólás, emoji, vagy privát üzenet a posztolónak?

### F) Profil (7. fázis előtt)
- **Q15 — Bejegyzések:** a profilon és a hírfolyamban látható bejegyzések azonosak a „keresek egy embert” bejegyzésekkel, vagy általános posztok? Ha külön posztok: hol hozza létre őket a felhasználó, és mit tartalmazhatnak?
- **Q16 — Barátok:** ki számít barátnak a beszélgetésekhez (kölcsönös követés?), és bárkinek lehet-e privát üzenetet küldeni?
- **Q17 — Látogatás és értékelés:** hogyan rögzítjük, hogy valaki járt egy helyen (csevegőtérbe lépés, helyalapú bejelentkezés, kézi jelölés)? Ki, mikor és milyen felületen értékel egy helyet (pl. 1–5 csillag lezárás után)? A „legjobban értékelt hely” a felhasználó saját legmagasabbra értékelt helye?
- **Q18 — Profil elrendezése:** a profilkép a kijelző közepén vagy tetején legyen? Van vizuális referencia a „neuron” animációhoz? Csak a 3 műfaj kapcsolódik a profilképhez, vagy előadó is?

### G) Platform és jog (8. fázis, de a tervezést már most befolyásolja)
- **Q23 —** (a) moderálás: jelentés, letiltás, szűrés; (b) fióktörlés az appon belül; (c) 18+ ellenőrzés; (d) GDPR: adatvédelmi tájékoztató, hozzájárulások, EU-s tárolás.
  - Az (a) és a (b) **nélkül az App Store nagy eséllyel elutasítja** az appot, mert van benne felhasználói tartalom (chat, képek, bejegyzések). A Google Play is megköveteli a fióktörlést.
  - A (d) jogilag kötelező.
  - Javaslom, hogy ezeket döntsük el korán, mert az adatmodellt érintik (pl. `reports` és `blocks` tábla, kaszkádolt törlés).

---

## 11. Javaslatok (jóváhagyásra várnak)

> 💡 **Javaslat P-01 (jóváhagyásra vár): eseménycsoportosítás (clustering) a térképen**
> - **Mi:** ha sok esemény van közel egymáshoz, a jelölők egy számozott körbe vonódnak össze, és nagyításra szétválnak.
> - **Miért:** egy városban (pl. a budapesti VII. kerületben) a jelölők egymásra lógnának, és nem lehetne rájuk koppintani.
> - **Munka:** kicsi.
> - **Kockázat:** alacsony. Az ajánlott események eltérő színének a csoporton belül is látszania kell (pl. a csoport színe ajánlott, ha van benne ajánlott esemény).

> 💡 **Javaslat P-02 (jóváhagyásra vár): ízlés-adatok nélküli állapot a Home-on**
> - **Mi:** ha a felhasználónak nincs elég ízlés-adata, vagy a távolságon belül nincs ajánlott esemény, a rács helyén egy rövid magyarázó üzenet jelenik meg (pl. „Növeld a távolságot a térképen”).
> - **Miért:** e nélkül a felhasználó üres képernyőt látna magyarázat nélkül.
> - **Munka:** kicsi.
> - **Kockázat:** nincs. Ez szöveg, nem új funkció, de a felhasználó látja, ezért kérdezem.

> 💡 **Javaslat P-03 (jóváhagyásra vár): admin-feltöltés az eseményekhez az első verzióban**
> - **Mi:** amíg a Q3 nincs véglegesen eldöntve, az eseményeket egy egyszerű módon (a Supabase-felületen vagy egy CSV-importtal) mi töltjük fel. Ehhez nem kell felület az appban.
> - **Miért:** a 4–6. fázis (ajánlás, chat, lezárás) e nélkül nem tesztelhető valós adattal.
> - **Munka:** kicsi.
> - **Kockázat:** kézi munka. Élesben csak kis régióban (egy városban) fenntartható.
