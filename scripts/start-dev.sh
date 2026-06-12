#!/usr/bin/env bash
#
# start-dev.sh — Avvio "one command" dell'ambiente di sviluppo Hemora.
#
# Cosa fa, in ordine:
#   1. Avvia in Docker backend + nginx + tunnel Cloudflare (profilo "tunnel").
#   2. Attende che il quick tunnel generi l'URL pubblico (*.trycloudflare.com),
#      facendo POLLING dei log (niente sleep fisso, piu affidabile).
#   3. Scrive quell'URL in apps/mobile/.env come EXPO_PUBLIC_HEMORA_API_URL.
#   4. Avvia Expo pulendo la cache (-c): Expo "inlina" le EXPO_PUBLIC_* al bundle,
#      quindi senza "-c" l'app userebbe il vecchio URL in cache.
#
# Uso:
#   ./scripts/start-dev.sh             avvia tutto + Expo
#   ./scripts/start-dev.sh --no-expo   solo backend/tunnel + scrittura .env
#   (oppure: npm run dev:tunnel)
#
set -euo pipefail

# --- Percorsi: lo script funziona da qualsiasi directory corrente ----------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$REPO_ROOT/apps/mobile/.env"
ENV_KEY="EXPO_PUBLIC_HEMORA_API_URL"
TUNNEL_SERVICE="tunnel"      # nome del servizio in docker-compose.yml
MAX_WAIT_SECONDS=45          # attesa massima per l'URL del tunnel

cd "$REPO_ROOT"

# --- 1) Avvio dei container (incluso il profilo "tunnel") ------------------
echo "▶  Avvio backend + nginx + tunnel Cloudflare…"
docker compose --profile "$TUNNEL_SERVICE" up -d --build

# --- 2) Attendo l'URL pubblico nei log del tunnel (polling) ----------------
echo "⏳  Attendo l'URL pubblico del tunnel (max ${MAX_WAIT_SECONDS}s)…"
PUBLIC_URL=""
for _ in $(seq 1 "$MAX_WAIT_SECONDS"); do
  # `|| true`: finché cloudflared non stampa l'URL, grep esce 1 e con
  # `set -euo pipefail` ucciderebbe lo script al primo giro. Così invece
  # continuiamo il polling fino a quando l'URL compare (o scade il timeout).
  PUBLIC_URL="$(docker compose logs "$TUNNEL_SERVICE" 2>/dev/null \
    | grep -Eo 'https://[a-z0-9-]+\.trycloudflare\.com' | tail -1 || true)"
  [ -n "$PUBLIC_URL" ] && break
  sleep 1
done

# --- 3) Blocco se l'URL non e' stato trovato -------------------------------
if [ -z "$PUBLIC_URL" ]; then
  echo "✖  URL del tunnel non trovato nei log dopo ${MAX_WAIT_SECONDS}s." >&2
  echo "   Diagnostica:  docker compose logs $TUNNEL_SERVICE" >&2
  exit 1
fi
echo "✓  Tunnel attivo: $PUBLIC_URL"

# Verifica (non bloccante) che il backend risponda davvero attraverso il tunnel.
if curl -fsS -m 10 "$PUBLIC_URL/health" >/dev/null 2>&1; then
  echo "✓  Health check OK ($PUBLIC_URL/health)"
else
  echo "⚠  Il tunnel non risponde ancora su /health: potrebbe servire qualche secondo."
fi

# --- 4) Scrivo l'URL in apps/mobile/.env -----------------------------------
# Sostituisco la riga se gia' presente, altrimenti la aggiungo (senza toccare i
# commenti). Uso awk per restare portabile (sed -i differisce tra macOS e Linux).
touch "$ENV_FILE"
if grep -qE "^${ENV_KEY}=" "$ENV_FILE"; then
  awk -v k="$ENV_KEY" -v v="$PUBLIC_URL" '$0 ~ "^"k"=" { print k"="v; next } { print }' \
    "$ENV_FILE" > "$ENV_FILE.tmp" && mv "$ENV_FILE.tmp" "$ENV_FILE"
else
  printf '%s=%s\n' "$ENV_KEY" "$PUBLIC_URL" >> "$ENV_FILE"
fi
echo "✓  Scritto in apps/mobile/.env →  ${ENV_KEY}=${PUBLIC_URL}"

# --- 5) Avvio Expo con cache pulita ----------------------------------------
if [ "${1:-}" = "--no-expo" ]; then
  echo "ℹ  --no-expo: salto l'avvio di Expo. Avvialo a parte con:  npx expo start -c"
  exit 0
fi

echo "▶  Avvio Expo (cache pulita, così usa subito il nuovo URL)…"
cd "$REPO_ROOT/apps/mobile"
npx expo start -c
