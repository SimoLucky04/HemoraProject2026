# Hemora Backend

Backend demo **local-first** per Hemora. Si occupa **solo** del dominio della
donazione del sangue e dei dati condivisi/simulati utili a testare l'app.

## Cosa gestisce il backend

- centri di raccolta (elenco e dettaglio);
- slot di donazione simulati per ogni centro;
- prenotazioni di donazione (creazione, elenco, annullamento);
- emergenze sangue, con filtro per compatibilità di gruppo/Rh e città;
- calcolo dell'idoneità alla prossima donazione.

## Cosa NON gestisce il backend (resta locale nell'app)

Profilo sanitario, patologie, allergie, farmaci salvavita, note salvavita,
contatti di emergenza e generazione/contenuto del QR di emergenza **non**
passano dal backend: sono dati salvavita conservati localmente nell'app
(AsyncStorage). Il backend non è un archivio centrale del profilo sanitario.

## Dati reali e simulati

Non usa database: i dati sono in memoria, così il progetto resta leggero e
facile da avviare.

- centri di raccolta: dataset curato di strutture reali della Campania in
  `src/data/collectionCenters.ts`;
- slot di donazione: generati al volo per i prossimi giorni feriali;
- prenotazioni: salvate in memoria (si azzerano al riavvio del backend);
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
GET    /health
GET    /api/centers
GET    /api/centers?lat=40.6824&lon=14.7681&radiusKm=30
GET    /api/centers/:id
GET    /api/centers/:id/slots
POST   /api/bookings
GET    /api/bookings
DELETE /api/bookings/:id
GET    /api/emergency-alerts
GET    /api/emergencies?bloodType=A&rh=positive&city=Salerno
GET    /api/donation-eligibility?type=Plasma&sex=M&lastDonationDate=2026-05-01
```

Note:

- `/api/centers` accetta `lat`, `lon` e `radiusKm` per restituire i centri
  reali più vicini alla posizione dell'utente. Senza coordinate restituisce il
  dataset completo.
- `/api/bookings` usa un `userId` opzionale (nel body in POST, in query in
  GET/DELETE) solo per associare la prenotazione: **non** salva il profilo
  sanitario dell'utente. È una gestione minimale pensata per il testing.
- `/api/emergencies` accetta il fattore Rh sia come simbolo (`+`/`-`) sia come
  parola (`positive`/`negative`). Restituisce le emergenze per cui l'utente
  (donatore) è compatibile con il gruppo richiesto.
- `/api/emergency-alerts` è mantenuto per compatibilità con il front-end
  esistente e restituisce le emergenze attive senza filtri di compatibilità.

## Test

```bash
npm test
```
