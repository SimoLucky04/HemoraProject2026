# @hemora/shared-types

Unica fonte di verità dei **tipi di dominio condivisi** tra app (`apps/mobile`) e backend (`apps/backend`): gruppo sanguigno, fattore Rh, tipo di donazione, centro di raccolta, emergenza sangue (`EmergencyBloodAlertDto`), scenari del **feed emergenze** per le notifiche push (`EmergencyFeedItem`) e **prenotazioni** (`Booking`, `CreateBookingInput`).

Consumato come dipendenza di workspace:

```ts
import type { CollectionCenter, DonationType } from '@hemora/shared-types';
```

Viene buildato in `dist/` (JS + dichiarazioni `.d.ts`) tramite `tsc`. Lo script `prepare` lo ricompila automaticamente a ogni `npm install`; in alternativa, dalla root:

```bash
npm run shared:build
```

I tipi puramente applicativi (profilo sanitario, stato UI) restano nell'app; quelli interni al server (es. l'interfaccia dello store) restano nel backend. Lato app, varianti per i form (es. gruppo sanguigno con valore vuoto) sono derivate localmente dai tipi canonici di questo pacchetto.
