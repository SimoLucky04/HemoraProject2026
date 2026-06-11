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
`http://<IP-del-PC>:8080/health`.

**Reti con "client isolation"** (tipiche WiFi universitarie/aziendali/guest): gli
access point bloccano il traffico **da dispositivo a dispositivo**, quindi l'IP
LAN del PC è irraggiungibile dagli altri client — anche se la porta è esposta e
il firewall è spento. Non è un problema risolvibile esponendo di più sulla LAN:
il blocco è a livello di rete.

La soluzione è un **tunnel** che passa da internet (in uscita, non bloccato dal
client isolation). È incluso nel compose come servizio `tunnel` (Cloudflare),
messo **davanti a nginx** e attivabile a richiesta:

```bash
npm run docker:tunnel          # = docker compose --profile tunnel up -d --build
npm run docker:tunnel:url      # stampa l'URL pubblico generato
# in alternativa: docker compose logs tunnel  → cerca https://....trycloudflare.com
```

L'URL `https://<random>.trycloudflare.com` è raggiungibile da **qualsiasi
dispositivo** (telefono, altro PC), senza installare nulla sul client e su
qualsiasi rete. Note:

- l'URL **cambia a ogni riavvio** del tunnel ed è **pubblico** (chi ha il link
  accede): va benissimo per demo/sviluppo, non per la produzione;
- per un URL stabile serve un account Cloudflare e un *named tunnel*.

> Alternativa peer-to-peer privata: [Tailscale](https://tailscale.com) installato
> su entrambi i dispositivi (usa poi `http://<tailscale-ip>:8080`).

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

Per far puntare l'app al backend tramite il proxy, imposta in
`apps/mobile/.env`:

```
# Stessa LAN (senza client isolation):
EXPO_PUBLIC_HEMORA_API_URL=http://<IP-del-tuo-PC>:8080

# Rete con client isolation (es. universitaria) → usa l'URL del tunnel:
EXPO_PUBLIC_HEMORA_API_URL=https://<random>.trycloudflare.com
```
