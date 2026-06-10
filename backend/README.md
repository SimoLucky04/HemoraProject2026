# Hemora Backend

Backend demo **local-first** per Hemora. Espone **solo** i dati condivisi e
simulati che l'app consuma davvero, con le **stesse regole di dominio** del
client: niente endpoint che l'app non usa.

## Cosa gestisce il backend

- centri di raccolta (elenco con filtro per posizione e dettaglio);
- emergenze sangue, con filtro opzionale per compatibilità di gruppo/Rh e città;
- regole e calcolo dell'idoneità alla prossima donazione, identici all'app.

## Cosa NON gestisce il backend (resta locale nell'app)

Profilo sanitario, patologie, allergie, farmaci salvavita, note salvavita,
contatti di emergenza, QR di emergenza **e prenotazioni/storico donazioni** non
passano dal backend: sono dati che l'app conserva localmente sul dispositivo
(AsyncStorage). Il backend non è un archivio centrale del profilo né del flusso
di prenotazione: l'app è **local-first**.

## Coerenza con l'app

- L'idoneità usa la stessa matrice di attesa *ultima → prossima donazione*
  (`WAIT_DAYS`) di `src/utils/donationEligibility.ts`: un'unica fonte di verità.
  L'endpoint `/api/donation-rules` la espone esplicitamente.
- I tipi di dominio (gruppo sanguigno, Rh, tipo donazione, centro, emergenza)
  rispecchiano quelli dell'app.

## Dati simulati

Nessun database: i dati sono in memoria, così il progetto resta leggero.

- centri di raccolta: dataset curato di strutture reali della Campania in
  `src/data/collectionCenters.ts`;
- emergenze sangue: elenco demo in memoria;
- logica di idoneità: `src/logic/eligibility.ts`;
- logica di compatibilità sangue: `src/logic/bloodCompatibility.ts`.

## Setup

```bash
cd backend
npm install
npm run dev
```

Opzionale: copia `.env.example` in `.env` solo se vuoi cambiare porta o CORS.

Variabili d'ambiente (`.env.example`):

```text
PORT=4000
CORS_ORIGIN="*"
```

## API disponibili

```text
GET  /health
GET  /api/centers
GET  /api/centers?lat=40.6824&lon=14.7681&radiusKm=30
GET  /api/centers/:id
GET  /api/emergency-alerts
GET  /api/emergencies?bloodType=A&rh=positive&city=Salerno
GET  /api/donation-rules
GET  /api/donation-eligibility?type=Plasma&lastType=Sangue%20intero&lastDonationDate=2026-05-01
```

Note:

- `/api/centers` accetta `lat`, `lon` e `radiusKm` per restituire i centri reali
  più vicini alla posizione dell'utente. Senza coordinate restituisce il dataset
  completo. È l'endpoint usato dall'app per la mappa.
- `/api/emergency-alerts` restituisce le emergenze attive senza filtri ed è
  l'endpoint usato dall'app per le notifiche.
- `/api/emergencies` accetta il fattore Rh sia come simbolo (`+`/`-`) sia come
  parola (`positive`/`negative`) e restituisce solo le emergenze per cui
  l'utente-donatore è compatibile con il gruppo richiesto.
- `/api/donation-eligibility` calcola l'idoneità dato il tipo della prossima
  donazione e, opzionalmente, tipo e data dell'ultima (`lastType`,
  `lastDonationDate`). Senza ultima donazione l'utente è idoneo.
