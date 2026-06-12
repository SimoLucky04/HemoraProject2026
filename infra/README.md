# Infra — Hemora

Orchestrazione Docker del backend Hemora dietro un reverse proxy **nginx**.
Backend e proxy girano sulla stessa rete Docker (`hemora-net`), così sono
raggiungibili dagli altri container del PC; l'host accede al backend passando
da nginx.

```
host  ──:8080──▶  nginx (hemora-nginx)  ──:4000──▶  backend (hemora-backend)
                         └────────── rete: hemora-net ──────────┘
```

## Avvio

Dalla root del repo:

```bash
docker compose up -d --build       # oppure: npm run docker:up
```

Verifica del forwarding (host → nginx → backend):

```bash
curl http://localhost:8080/health
curl http://localhost:8080/api/centers
curl http://localhost:8080/nginx-health   # health del solo proxy
```

Stop:

```bash
docker compose down                # oppure: npm run docker:down
```

## Raggiungere il backend da altri container

`hemora-net` è una rete bridge con nome fisso. Un altro container può unirsi:

```bash
docker network connect hemora-net <altro-container>
# poi, da dentro quel container:
#   http://backend:4000      (diretto)
#   http://nginx:80          (via proxy)
```

Oppure, in un altro `docker-compose.yml`:

```yaml
networks:
  hemora-net:
    external: true
```

## Accesso da altri dispositivi della rete

Sulla stessa LAN basta l'IP del PC: dal telefono/altro PC apri
`http://<IP-del-PC>:8080/health` (IP da `ipconfig getifaddr en0`).

> **Reti con "client isolation"** (tipiche WiFi universitarie/aziendali/guest):
> gli access point bloccano il traffico **da dispositivo a dispositivo**, quindi
> l'IP LAN del PC è irraggiungibile dagli altri client — anche se la porta è
> esposta e il firewall è spento. È un blocco a livello di rete, non risolvibile
> esponendo di più sulla LAN: in quel caso usa un **hotspot** del telefono o una
> rete domestica.

## Configurazione

Variabili (opzionali) lette da `docker compose`:

| Variabile          | Default | Descrizione                         |
| ------------------ | ------- | ----------------------------------- |
| `HEMORA_HTTP_PORT` | `8080`  | Porta HTTP esposta sull'host        |
| `CORS_ORIGIN`      | `*`     | Origini CORS consentite dal backend |

## File

- `apps/backend/Dockerfile` — build multi-stage del backend (context = root del repo).
- `infra/nginx/nginx.conf` — configurazione del reverse proxy.
- `docker-compose.yml` (root) — definizione dei servizi e della rete.

## App mobile

Di default l'app **rileva da sola** l'IP del PC dall'host del bundler Metro e usa
la porta di nginx (`8080`): sulla stessa LAN non serve configurare nulla. Per
forzare un indirizzo fisso imposta in `apps/mobile/.env`:

```
EXPO_PUBLIC_HEMORA_API_URL=http://<IP-del-tuo-PC>:8080
```

> Expo **inlina** le variabili `EXPO_PUBLIC_*` nel bundle: dopo ogni modifica al
> `.env` riavvia Expo pulendo la cache con `npx expo start -c`, altrimenti l'app
> continua a usare il valore precedente.
