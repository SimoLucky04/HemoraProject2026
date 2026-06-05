# Hemora

App Expo/React Native per il progetto universitario Hemora.

Hemora ora usa un'impostazione local-first: profilo sanitario, QR, donazioni e prenotazioni simulate restano sul dispositivo in AsyncStorage. Il backend demo espone solo dati simulati condivisi, cioè centri raccolta e alert emergenza sangue.

## Struttura aggiornata della navigazione

La barra inferiore è stata semplificata a 4 sezioni principali:

1. **Home** — riepilogo generale del profilo salvavita, donazioni, notifiche e prenotazioni.
2. **Profilo** — dati essenziali del profilo sanitario. Da qui si accede alle sottosezioni:
   - Patologie e allergie
   - Farmaci salvavita
   - Contatti emergenza
   - Dati opzionali
   - Impostazioni
3. **Donazioni** — hub con sottosezioni:
   - Registra donazione
   - Storico donazioni
   - Centri raccolta
   - Prenotazioni
4. **Emergenza** — QR Code di emergenza leggibile offline.

Questa struttura evita di avere troppe voci nella tab bar e rispetta meglio la logica dell'app: poche macro-aree principali con sottosezioni interne.

## Installazione

Clona il repository e installa le dipendenze:

```bash
git clone <url-del-repository>
cd HemoraProject2026
npm install
```

Avvio:

```bash
npx expo start
```

Per Expo Go su telefono fisico, `localhost` non indica il computer ma il telefono. Se vuoi collegare anche il backend demo, crea un file `.env` nella root usando l'IP locale del Mac:

```bash
cp .env.example .env
```

Esempio:

```text
EXPO_PUBLIC_HEMORA_API_URL=http://192.168.1.10:4000
```

Poi avvia Expo:

```bash
npx expo start
```

Se non configuri questa variabile o il backend non risponde, l'app resta comunque utilizzabile in Expo Go con i dati locali/mock.

## Backend demo

Il backend si trova in `backend/` e si occupa **solo** della donazione del
sangue. Profilo sanitario, patologie, farmaci, contatti di emergenza e QR
restano locali nell'app (AsyncStorage). Espone:

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

I centri sono un dataset curato di strutture reali della Campania, con fonti
regionali/associative salvate nei record. Slot, prenotazioni ed emergenze sono
dati simulati in memoria (dettagli in `backend/README.md`).

Setup locale:

```bash
cd backend
npm install
npm run dev
```

Non serve Docker e non serve PostgreSQL: il backend universitario usa dati demo in memoria.

Dalla root puoi usare anche:

```bash
npm run backend:dev
npm run backend:test
npm run backend:build
```

L'app prova a leggere il backend da `EXPO_PUBLIC_HEMORA_API_URL`, oppure da `http://localhost:4000` se la variabile non è configurata. In Expo Go su telefono fisico usa sempre l'IP locale del computer.

## Nota

Le prenotazioni sono simulate per il progetto universitario: non ci sono slot reali, disponibilità o cancellazioni lato server. Notifiche push reali, geolocalizzazione reale, cifratura locale e autenticazione biometrica restano possibili step successivi.
