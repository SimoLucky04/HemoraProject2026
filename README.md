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

Con il backend in Docker (`npm run docker:up`, nginx sulla porta `8080`) **non serve configurare nulla**: l'app deduce da sola l'IP del Mac dall'host del bundler Metro a cui il dispositivo è già connesso e lo usa con la porta di nginx (`8080`). L'indirizzo **segue la rete automaticamente** (cambi WiFi/hotspot → cambia l'IP) e funziona sia col simulatore iOS sia col telefono fisico sulla stessa LAN.

| Scenario | Configurazione |
|---|---|
| Docker (`docker:up`) — simulatore o telefono sulla stessa WiFi | nessuna (auto, porta 8080) |
| Senza Docker (`backend:dev`, porta 4000) | `EXPO_PUBLIC_HEMORA_API_URL=http://<IP-del-Mac>:4000` |
| Forzare un IP/host fisso | `EXPO_PUBLIC_HEMORA_API_URL=http://<IP>:8080` |

Per forzare un indirizzo imposta `EXPO_PUBLIC_HEMORA_API_URL` in `apps/mobile/.env` (ha la precedenza sull'auto-detect; IP del Mac da `ipconfig getifaddr en0`). Expo **inlina** le variabili `EXPO_PUBLIC_*` al momento del bundle: dopo ogni modifica al `.env` riavvia Expo pulendo la cache con **`npx expo start -c`**.

> Le reti con *client isolation* (alcune WiFi universitarie/guest) bloccano il traffico tra dispositivi sulla LAN: in quel caso usa un **hotspot** del telefono o una rete domestica.

Se il backend non risponde, l'app resta utilizzabile con i dati locali/mock (le **prenotazioni**, però, richiedono il backend).

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

Per raggiungere il backend da un altro dispositivo sulla **stessa LAN** (telefono, altro PC) basta l'IP del PC: apri `http://<IP-del-PC>:8080/health` (IP da `ipconfig getifaddr en0`). Dettagli, override e come collegare altri container alla rete: [infra/README.md](infra/README.md).

## Navigazione dell'app

La barra inferiore ha 3 sezioni principali:

1. **Donazioni** — hub con stato di idoneità, Storico donazioni e Prenotazioni (con creazione di una nuova prenotazione).
2. **Home** — riepilogo di profilo salvavita, donazioni, notifiche e prenotazioni, con il **QR Code di emergenza** leggibile offline.
3. **Profilo** — dati essenziali, con sottosezioni: Patologie e allergie, Farmaci salvavita, Contatti emergenza, Dati opzionali, Impostazioni.

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
