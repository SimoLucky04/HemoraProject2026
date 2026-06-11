# Hemora Mobile (`@hemora/mobile`)

App Expo / React Native di Hemora, parte del monorepo (`apps/mobile`). Local-first: profilo, QR, donazioni e prenotazioni restano sul dispositivo (AsyncStorage); il backend serve solo dati condivisi (centri ed emergenze).

## Struttura `src/`

```
src/
├── api/          # client HTTP verso il backend (hemoraApi.ts)
├── components/   # componenti UI riutilizzabili
├── context/      # HemoraContext (stato globale + AsyncStorage)
├── data/         # dati mock locali
├── navigation/   # MainTabs e stack
├── screens/      # schermate
├── theme/        # design token (colori, spacing, ombre)
├── types/        # tipi dell'app + re-export di @hemora/shared-types
└── utils/        # utility (date, validazione, idoneità, notifiche)
```

## Path alias

Niente più `../../`: gli import usano alias definiti in `tsconfig.json` (per il type-check) e in `babel.config.js` (per il runtime), tenuti allineati.

| Alias | Cartella |
|---|---|
| `@api`, `@components`, `@context`, `@data` | `src/api`, `src/components`, … |
| `@navigation`, `@screens`, `@theme`, `@utils` | `src/navigation`, `src/screens`, … |
| `@app-types` | `src/types` |

Esempio: `import { colors } from '@theme';`

## Avvio

Dalla **root del monorepo** (dopo `npm install`):

```bash
npm run mobile               # expo start
# equivalente esplicito:
npm run start -w @hemora/mobile
```

Poi premi `i` (iOS), `a` (Android) oppure inquadra il QR con Expo Go.

## Collegamento al backend

L'app legge `EXPO_PUBLIC_HEMORA_API_URL` (default `http://localhost:4000`).

- **Simulatore/emulatore**: nessuna configurazione.
- **Telefono fisico**: copia `.env.example` in `.env` e usa l'IP locale del Mac.

## Monorepo / Metro

`metro.config.js` è configurato per i workspace (watchFolders sulla root del monorepo + node_modules hoistati). L'entry point è `index.js` con `registerRootComponent`, robusto all'hoisting di Expo (non dipende dal path relativo di `expo/AppEntry.js`).
