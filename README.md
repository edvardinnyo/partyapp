# Nocturnal

Zenei ízlés alapú esemény- és közösségi mobilapp iOS-re és Androidra. A „Nocturnal” munkacím.

- Feladatleírás és szabályok: [CLAUDE.md](CLAUDE.md)
- Architektúra-terv (0. fázis): [docs/PHASE0.md](docs/PHASE0.md)
- Döntésnapló: [docs/DECISIONS.md](docs/DECISIONS.md)

## Technológia

- Expo SDK 57 (React Native 0.86, React 19.2), TypeScript (strict)
- Expo Router (navigáció), i18next (magyar és angol felület), Zustand (kliensállapot)
- Jest, React Native Testing Library, ESLint, Prettier
- Backend a 2. fázistól: Supabase (EU) és Drizzle ORM ([docs/PHASE0.md](docs/PHASE0.md), 2.1)

## Előfeltételek

- Node.js 22 (lásd `.nvmrc`) és npm
- A telefonon az **Expo Go** app (App Store, Google Play). Az Expo Go mindig csak a legfrissebb Expo SDK-t támogatja (most az 57-et).
- Opcionális: Android-emulátor (Android Studio). iOS-szimulátor csak macOS-en fut.

## Indítás

```sh
npm ci
npm start
```

Ezután a terminálban megjelenő QR-kódot kell beolvasni: iPhone-on a Kamera appal, Androidon az Expo Go-val. A telefon és a gép legyen ugyanazon a Wi-Fi-hálózaton. Ha így nem csatlakozik: `npx expo start --tunnel`.

Az 1. fázisban a belépés még helykitöltő: a „Belépés” gomb azonnal beléptet, és az app újraindítása után újra a belépő képernyő jelenik meg.

## Parancsok

| Parancs | Mit csinál |
|---|---|
| `npm start` | Fejlesztői szerver (Expo Go) |
| `npm run typecheck` | TypeScript-ellenőrzés |
| `npm run lint` | ESLint- és Prettier-ellenőrzés |
| `npm run format` | A kód automatikus formázása |
| `npm test` | Tesztek |
| `npm run test:watch` | Tesztek figyelő módban |

A CI (GitHub Actions) minden pull requesten lefuttatja a typecheck, a lint és a tesztek lépést.

## Környezeti változók

- A kulcsok listája a `.env.example` fájlban van. Másold le `.env` néven, és töltsd ki. A `.env` soha nem kerül a repóba.
- Az appból csak az `EXPO_PUBLIC_` előtagú változók érhetők el, és ezek bekerülnek az app kódjába. **Titok (API-kulcs, client secret, token) soha nem kerülhet beléjük**; a titkok helye az EAS Secrets és a Supabase secrets.

## Mappaszerkezet

```
src/
├─ app/          # képernyők és navigáció (Expo Router): minden fájl egy útvonal
│  ├─ (auth)/    # belépés, regisztráció, streaming-szinkron, kézi ízlés (navbar nélkül)
│  ├─ (tabs)/    # a 3 elemű navbar: csevegőtér, Home, profilkereső
│  └─ profile/   # profil (navbar nélkül)
├─ components/   # közös UI-elemek
├─ features/     # funkciónkénti logika és állapot
├─ i18n/         # felületi szövegek (locales/hu.ts a forrás, az en.ts ugyanazokat a kulcsokat adja)
├─ theme/        # színek, sötét és világos mód
└─ __tests__/    # képernyőkön átívelő tesztek (az egységtesztek a kód mellett vannak)
```

## Build (EAS)

Az `eas.json` három profilt tartalmaz: `development`, `preview` és `production`. A D-003 döntés szerint egyelőre Expo Go-val dolgozunk, ezért buildet még nem futtatunk. Amikor szükség lesz rá:

```sh
npx eas-cli@latest login
npx eas-cli@latest init      # a kapott projektazonosítót az app.config.ts-be kell írni (extra.eas.projectId)
npx eas-cli@latest build --profile preview --platform android
```

- Az iOS-buildhez Apple Developer Program-tagság kell.
- A `development` profilhoz előbb telepíteni kell az `expo-dev-client` csomagot.

## Munkafolyamat

- A `main` ág védett. Minden munka külön ágon készül (`feature/…`, `fix/…`, `chore/…`, `docs/…`), és pull requesttel, egy jóváhagyással kerül a `main`-re.
- Commitüzenetek: Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`, `test:`, `docs:`).
- A kódban az elnevezések és a kommentek angolul vannak. A felületi szövegek kizárólag a `src/i18n/locales` mappába kerülnek.
- Új függőséget `npx expo install <csomag>` paranccsal telepítünk, hogy az Expo SDK-val kompatibilis verzió kerüljön be.
