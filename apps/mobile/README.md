# Hemora Mobile (`@hemora/mobile`)

App Expo / React Native di Hemora, parte del monorepo (`apps/mobile`). Local-first: profilo, QR e storico donazioni restano sul dispositivo (AsyncStorage); il backend gestisce i dati condivisi (centri, emergenze) e le **prenotazioni**.

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

L'app legge `EXPO_PUBLIC_HEMORA_API_URL` da `.env` (default `http://localhost:4000`). Expo **inlina** le variabili `EXPO_PUBLIC_*` nel bundle: dopo ogni modifica al `.env` riavvia con **`npx expo start -c`**, altrimenti il valore vecchio resta in cache.

- **Simulatore/emulatore**: nessuna configurazione (`localhost:4000`).
- **Telefono fisico, stessa WiFi**: `http://<IP-del-Mac>:8080` (Docker) o `:4000` (`backend:dev`). IP del Mac: `ipconfig getifaddr en0`.
- **Qualsiasi rete (consigliato)**: dalla root lancia `npm run dev:tunnel` — avvia il tunnel Cloudflare, scrive l'URL `https://….trycloudflare.com` in questo `.env` e fa partire Expo con cache pulita, tutto in un comando. Funziona anche su reti con *client isolation* (WiFi universitaria). Dettagli e versione manuale: [infra/README.md](../../infra/README.md).

> Le **prenotazioni** passano dal backend: senza connessione non si creano (centri ed emergenze hanno invece un fallback ai dati mock locali).

## Monorepo / Metro

`metro.config.js` è configurato per i workspace (watchFolders sulla root del monorepo + node_modules hoistati). L'entry point è `index.js` con `registerRootComponent`, robusto all'hoisting di Expo (non dipende dal path relativo di `expo/AppEntry.js`).
