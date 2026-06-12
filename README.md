# Hemora

App Expo/React Native per il progetto universitario Hemora, organizzata come **monorepo npm workspaces**.

Hemora usa un'impostazione local-first: profilo sanitario, QR e storico donazioni restano sul dispositivo in AsyncStorage. Il backend demo gestisce i dati condivisi e simulati — centri di raccolta, emergenze sangue (compreso il feed usato per le notifiche push) e **prenotazioni** (identificate dall'email utente).

## Avvio rapido del backend

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
├── scripts/
│   └── start-dev.sh     # avvio one-command: Docker + tunnel + .env + Expo
├── docker-compose.yml   # orchestrazione backend + nginx + tunnel (rete hemora-net)
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

L'app legge l'URL dell'API da `EXPO_PUBLIC_HEMORA_API_URL` (in `apps/mobile/.env`), altrimenti usa `http://localhost:4000`. Expo **inlina** le variabili `EXPO_PUBLIC_*` al momento del bundle: dopo ogni modifica al `.env` riavvia Expo pulendo la cache con **`npx expo start -c`**.

| Scenario | Valore di `EXPO_PUBLIC_HEMORA_API_URL` |
|---|---|
| Simulatore iOS / emulatore Android | `http://localhost:4000` (default, nessuna configurazione) |
| Telefono fisico, stessa WiFi del Mac | `http://<IP-del-Mac>:8080` (Docker) o `:4000` (`backend:dev`) — IP da `ipconfig getifaddr en0` |
| **Qualsiasi rete** (anche WiFi con *client isolation*) | URL del **tunnel Cloudflare** `https://<random>.trycloudflare.com` |

**Tunnel Cloudflare — consigliato, funziona da qualsiasi rete e dispositivo.**

Modo più semplice, un solo comando:

```bash
npm run dev:tunnel
```

Lo script [`scripts/start-dev.sh`](scripts/start-dev.sh) avvia backend + nginx + tunnel, attende l'URL pubblico, lo scrive automaticamente in `apps/mobile/.env` e lancia Expo con cache pulita. Aggiungi `--no-expo` per fermarti prima dell'avvio di Expo (`bash scripts/start-dev.sh --no-expo`).

In alternativa, manualmente:

```bash
npm run docker:tunnel        # avvia backend + nginx + tunnel
npm run docker:tunnel:url    # stampa l'URL pubblico https://....trycloudflare.com
```

…poi copia l'URL in `apps/mobile/.env` e rilancia `npx expo start -c`. L'URL del tunnel *free* **cambia a ogni riavvio** del tunnel (lo script lo riscrive da solo a ogni esecuzione). Dettagli e opzione con URL stabile: [infra/README.md](infra/README.md).

Se la variabile non è configurata o il backend non risponde, l'app resta utilizzabile con i dati locali/mock (le **prenotazioni**, però, richiedono il backend).

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

Per raggiungere il backend da **qualsiasi rete** (telefono su WiFi diversa, reti con *client isolation*) c'è un tunnel pubblico Cloudflare opzionale, davanti a nginx. Il modo più rapido è `npm run dev:tunnel` (avvia tutto, scrive l'URL nel `.env` e lancia Expo); manualmente:

```bash
npm run docker:tunnel      # avvia anche il tunnel
npm run docker:tunnel:url  # stampa l'URL https://....trycloudflare.com
```

Dettagli, override, tunnel e come collegare altri container alla rete: [infra/README.md](infra/README.md).

## Navigazione dell'app

La barra inferiore ha 4 sezioni principali:

1. **Home** — riepilogo generale di profilo salvavita, donazioni, notifiche e prenotazioni.
2. **Profilo** — dati essenziali, con sottosezioni: Patologie e allergie, Farmaci salvavita, Contatti emergenza, Dati opzionali, Impostazioni.
3. **Donazioni** — hub con: Registra donazione, Storico donazioni, Centri raccolta, Prenotazioni.
4. **Emergenza** — QR Code di emergenza leggibile offline.

## Backend demo (sintesi)

Il backend ([apps/backend/](apps/backend/)) si occupa della donazione del sangue (centri, emergenze, idoneità) e delle **prenotazioni**; profilo, patologie, farmaci, contatti, QR e storico donazioni restano locali nell'app. Endpoint principali:

```text
GET    /health
GET    /api/centers
GET    /api/centers?lat=40.6824&lon=14.7681&radiusKm=30
GET    /api/centers/:id
GET    /api/emergency-alerts
GET    /api/emergency-feed      # scenari emergenza per le notifiche push simulate
GET    /api/emergencies?bloodType=A&rh=positive&city=Salerno
GET    /api/donation-rules
GET    /api/donation-eligibility?type=Plasma&lastType=Sangue%20intero&lastDonationDate=2026-05-01
GET    /api/bookings           # prenotazioni dell'utente (header X-User-Email)
POST   /api/bookings           # crea una prenotazione (validata dal backend)
DELETE /api/bookings           # cancella tutte le prenotazioni dell'utente (reset)
DELETE /api/bookings/:id       # annulla una prenotazione
```

Dettagli completi in [apps/backend/README.md](apps/backend/README.md). Nessun database: dati demo in memoria (le prenotazioni si azzerano al riavvio del backend). Per l'esecuzione in container vedi la sezione [Docker](#docker-backend--reverse-proxy-nginx).

## Nota

Slot, notifiche — incluse le **emergenze push** (scenari presi dal feed del backend e mostrati a caso, uno alla volta) — e prenotazioni sono simulati per il progetto universitario: le prenotazioni sono gestite dal backend demo (in memoria, identificate dall'email utente). Geolocalizzazione reale, cifratura locale e autenticazione biometrica restano step successivi.
