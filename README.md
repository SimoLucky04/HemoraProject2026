# Hemora

App Expo/React Native per il progetto universitario Hemora, organizzata come **monorepo npm workspaces**.

Hemora usa un'impostazione local-first: profilo sanitario, QR, donazioni e prenotazioni simulate restano sul dispositivo in AsyncStorage. Il backend demo espone solo dati simulati condivisi (centri di raccolta e alert emergenza sangue).

## 🚀 Avvio rapido del backend

**Opzione A — con Docker** (serve Docker Desktop avviato). Niente da installare:

```bash
npm run docker:up
```

Aspetta ~1 minuto la prima volta, poi apri nel browser **http://localhost:8080/health** → deve rispondere `{"status":"ok",...}`. Per fermare: `npm run docker:down`.

**Opzione B — senza Docker** (Node.js):

```bash
npm install            # solo la prima volta
npm run backend:dev    # backend su http://localhost:4000
```

Controllo: apri **http://localhost:4000/health**. Per fermare: `Ctrl+C`.

> Dettagli (app mobile, comandi avanzati, Docker): vedi le sezioni sotto.

## Struttura del monorepo
 
```
HemoraProject2026/
├── apps/
│   ├── mobile/          # App Expo / React Native (frontend)
│   └── backend/         # API Node + Express + TypeScript (backend) + Dockerfile
├── packages/
│   └── shared-types/    # @hemora/shared-types — tipi di dominio condivisi FE/BE
├── infra/
│   └── nginx/           # reverse proxy nginx davanti al backend
├── docker-compose.yml   # orchestrazione backend + nginx (rete hemora-net)
├── package.json         # workspace root (npm workspaces)
└── tsconfig.base.json   # opzioni TypeScript comuni
```

I tipi di dominio condivisi (gruppo sanguigno, Rh, tipo donazione, centro, emergenza) vivono in un'unica fonte di verità, `@hemora/shared-types`, importata sia dall'app sia dal backend.

## Requisiti

- Node.js ≥ 18 (testato con Node 24)
- npm ≥ 9 (supporto workspaces)

## Installazione

Un solo `npm install` alla **root** installa tutti i workspace e builda `shared-types`:

```bash
git clone <url-del-repository>
cd HemoraProject2026
npm install
```

## Avvio in locale

Servono due terminali (backend + Expo). Tutti i comandi si lanciano **dalla root**.

Terminale 1 — backend demo (http://localhost:4000):

```bash
npm run backend:dev
```

Terminale 2 — app Expo:

```bash
npm run mobile
```

Comandi equivalenti espliciti per workspace:

```bash
npm run dev   -w @hemora/backend
npm run start -w @hemora/mobile
```

### Collegare l'app al backend

L'app legge l'URL dell'API da `EXPO_PUBLIC_HEMORA_API_URL`, altrimenti usa `http://localhost:4000`.

- **Simulatore iOS / emulatore Android**: `localhost:4000` va bene, nessuna configurazione.
- **Telefono fisico (Expo Go)**: `localhost` è il telefono, non il Mac. Crea `apps/mobile/.env` con l'IP locale del Mac:

  ```bash
  cp apps/mobile/.env.example apps/mobile/.env
  ```

  ```text
  EXPO_PUBLIC_HEMORA_API_URL=http://192.168.1.10:4000
  ```

Se la variabile non è configurata o il backend non risponde, l'app resta utilizzabile con i dati locali/mock.

## Altri script (dalla root)

```bash
npm run typecheck      # tsc --noEmit su shared-types, mobile e backend
npm run backend:test   # test del backend (vitest)
npm run backend:build  # build del backend
npm run shared:build   # build di @hemora/shared-types
```

## Docker (backend + reverse proxy nginx)

Il backend può girare in container dietro un **reverse proxy nginx**, entrambi
sulla rete Docker condivisa `hemora-net` (raggiungibile dagli altri container
del PC). L'host accede al backend passando da nginx.

```bash
npm run docker:up      # build + avvio (docker compose up -d --build)
curl http://localhost:8080/health        # host -> nginx -> backend
curl http://localhost:8080/api/centers
npm run docker:down    # stop
```

Dettagli, override e come collegare altri container alla rete: [infra/README.md](infra/README.md).

## Navigazione dell'app

La barra inferiore ha 4 sezioni principali:

1. **Home** — riepilogo generale di profilo salvavita, donazioni, notifiche e prenotazioni.
2. **Profilo** — dati essenziali, con sottosezioni: Patologie e allergie, Farmaci salvavita, Contatti emergenza, Dati opzionali, Impostazioni.
3. **Donazioni** — hub con: Registra donazione, Storico donazioni, Centri raccolta, Prenotazioni.
4. **Emergenza** — QR Code di emergenza leggibile offline.

## Backend demo (sintesi)

Il backend ([apps/backend/](apps/backend/)) si occupa **solo** della donazione del sangue; profilo, patologie, farmaci, contatti e QR restano locali nell'app. Endpoint principali:

```text
GET /health
GET /api/centers
GET /api/centers?lat=40.6824&lon=14.7681&radiusKm=30
GET /api/centers/:id
GET /api/emergency-alerts
GET /api/emergencies?bloodType=A&rh=positive&city=Salerno
GET /api/donation-rules
GET /api/donation-eligibility?type=Plasma&lastType=Sangue%20intero&lastDonationDate=2026-05-01
```

Dettagli completi in [apps/backend/README.md](apps/backend/README.md). Nessun database: dati demo in memoria. Per l'esecuzione in container vedi la sezione [Docker](#docker-backend--reverse-proxy-nginx).

## Nota

Prenotazioni, slot e notifiche sono simulati per il progetto universitario. Geolocalizzazione reale, cifratura locale e autenticazione biometrica restano step successivi.
