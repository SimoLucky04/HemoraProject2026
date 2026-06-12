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

Di default l'app **deduce da sola** l'IP del Mac dall'host del bundler Metro e lo usa con la porta di nginx (`8080`): col backend in Docker (`npm run docker:up`) non serve configurare nulla, né sul simulatore né sul telefono fisico sulla stessa WiFi. L'indirizzo segue la rete in automatico.

Per forzare un indirizzo imposta `EXPO_PUBLIC_HEMORA_API_URL` in `.env` (ha la precedenza sull'auto-detect). Expo **inlina** le variabili `EXPO_PUBLIC_*` nel bundle: dopo ogni modifica al `.env` riavvia con **`npx expo start -c`**, altrimenti il valore vecchio resta in cache.

- **Docker (`docker:up`)**: nessuna configurazione (auto, porta 8080).
- **Senza Docker (`backend:dev`, porta 4000)**: `EXPO_PUBLIC_HEMORA_API_URL=http://<IP-del-Mac>:4000` (IP del Mac: `ipconfig getifaddr en0`).

Dettagli e override: [infra/README.md](../../infra/README.md).

> **Cosa richiede il backend**: le **prenotazioni** e le **emergenze** (vedi sotto). Senza connessione non si creano prenotazioni e non scatta nessuna emergenza. I **centri di raccolta** hanno invece un fallback ai dati mock locali, così mappa ed elenco restano usabili offline.

## Notifiche ed emergenze

- **Elenco in-app (sezione Notifiche)**: mostra l'avviso di benvenuto (mock locale) e i **promemoria di idoneità**, derivati dallo storico donazioni locale. Le emergenze che scattano vengono salvate qui, esattamente come i promemoria di idoneità.
- **Emergenze come push simulate**: a intervalli casuali (una alla volta) l'app chiede al backend uno scenario dal feed `GET /api/emergency-feed` e lo mostra sia come notifica push di sistema sia nell'elenco in-app. Gli scenari vivono **solo sul backend**: senza server non scatta nulla.
- Dal pannello **Sviluppo → "Simula emergenza ora"** se ne può innescare una manualmente (utile per la demo).

## Monorepo / Metro

`metro.config.js` è configurato per i workspace (watchFolders sulla root del monorepo + node_modules hoistati). L'entry point è `index.js` con `registerRootComponent`, robusto all'hoisting di Expo (non dipende dal path relativo di `expo/AppEntry.js`).
