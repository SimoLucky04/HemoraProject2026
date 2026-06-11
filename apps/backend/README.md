# Hemora Backend (`@hemora/backend`)

API demo **local-first** per Hemora, parte del monorepo (`apps/backend`). Espone **solo** i dati condivisi e simulati che l'app consuma davvero, con le **stesse regole di dominio** del client.

## Cosa gestisce

- centri di raccolta (elenco con filtro per posizione e dettaglio);
- emergenze sangue, con filtro opzionale per compatibilità di gruppo/Rh e città;
- regole e calcolo dell'idoneità alla prossima donazione, identici all'app.

## Cosa NON gestisce (resta locale nell'app)

Profilo sanitario, patologie, allergie, farmaci, note salvavita, contatti di emergenza, QR **e prenotazioni/storico donazioni** non passano dal backend: l'app è **local-first** (AsyncStorage).

## Architettura (layered)

```
src/
├── server.ts        # bootstrap: listen + graceful shutdown
├── app.ts           # createApp(store): middleware → router → 404 → error handler
├── routes/          # definizione endpoint → controller
├── controllers/     # gestione request/response + validazione input
├── services/        # logica di business pura (idoneità, compatibilità sangue)
├── data/            # repository in memoria (MemoryStore) + seed + interfaccia store
├── middlewares/     # errorHandler, notFound
└── utils/           # helper di parsing dei query param
```

I tipi di dominio (gruppo, Rh, tipo donazione, centro, emergenza) arrivano da **`@hemora/shared-types`**, unica fonte di verità condivisa con l'app.

## Coerenza con l'app

- L'idoneità usa la stessa matrice di attesa *ultima → prossima donazione* (`WAIT_DAYS`) di `apps/mobile/src/utils/donationEligibility.ts`: l'endpoint `/api/donation-rules` la espone.
- Logica di idoneità: `src/services/eligibility.service.ts`; compatibilità sangue: `src/services/bloodCompatibility.service.ts`.

## Dati simulati

Nessun database: tutto in memoria, così il progetto resta leggero.

- centri di raccolta: dataset curato di strutture reali della Campania in `src/data/collectionCenters.ts`;
- emergenze sangue: elenco demo in `src/data/memoryStore.ts`.

## Setup e avvio

Tutti i comandi si lanciano dalla **root del monorepo**.

**In Docker** (con nginx davanti, serve Docker Desktop avviato):

```bash
npm run docker:up            # build + avvio → http://localhost:8080/health
npm run docker:down          # stop
```

**In locale** (Node, dopo `npm install`):

```bash
npm run backend:dev          # tsx watch → http://localhost:4000
# equivalente esplicito:
npm run dev -w @hemora/backend
```

> Nota: in locale il backend è su `:4000`; in Docker l'accesso passa da nginx su `:8080`. Guida Docker completa: [`infra/README.md`](../../infra/README.md).

Altri comandi:

```bash
npm run backend:test                  # vitest
npm run backend:build                 # tsc
npm run typecheck -w @hemora/backend  # tsc --noEmit
```

Opzionale: copia `apps/backend/.env.example` in `apps/backend/.env` solo per cambiare porta o CORS.

```text
PORT=4000
CORS_ORIGIN="*"
```

## API disponibili

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

Note:

- `/api/centers` accetta `lat`, `lon` e `radiusKm` per i centri più vicini; senza coordinate restituisce il dataset completo. È l'endpoint usato dall'app per la mappa.
- `/api/emergency-alerts` restituisce le emergenze attive senza filtri ed è l'endpoint usato dall'app per le notifiche.
- `/api/emergencies` accetta il fattore Rh sia come simbolo (`+`/`-`) sia come parola (`positive`/`negative`) e restituisce solo le emergenze per cui l'utente-donatore è compatibile con il gruppo richiesto.
- `/api/donation-eligibility` calcola l'idoneità dato il tipo della prossima donazione e, opzionalmente, tipo e data dell'ultima (`lastType`, `lastDonationDate`). Senza ultima donazione l'utente è idoneo.
