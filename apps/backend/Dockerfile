# syntax=docker/dockerfile:1

# Immagine del backend Hemora in un monorepo npm-workspaces.
# Il build context e la ROOT del repo (vedi docker-compose.yml) perche il
# backend dipende dal package condiviso @hemora/shared-types.

# --- Stage 1: build -------------------------------------------------------
FROM node:22-alpine AS builder
WORKDIR /repo

# tsconfig base + sorgenti COMPLETI dei tipi condivisi PRIMA dell'install: il
# loro script "prepare" (tsc) puo girare durante npm install e ha bisogno dei
# sorgenti e del tsconfig, non solo del package.json.
COPY tsconfig.base.json ./
COPY packages/shared-types ./packages/shared-types
COPY apps/backend/package.json ./apps/backend/

# Root di workspace minimale per l'immagine: include SOLO il backend e i tipi
# condivisi (l'app mobile non serve qui), cosi l'install resta leggero e veloce.
RUN printf '%s\n' \
  '{' \
  '  "name": "hemora-backend-image",' \
  '  "private": true,' \
  '  "workspaces": ["packages/shared-types", "apps/backend"]' \
  '}' > package.json \
 && npm install --ignore-scripts --no-audit --no-fund

# Sorgenti del backend, poi build (prima i tipi condivisi, poi il backend).
COPY apps/backend ./apps/backend
RUN npm run build -w @hemora/shared-types \
 && npm run build -w @hemora/backend \
 && npm prune --omit=dev --ignore-scripts

# --- Stage 2: runtime -----------------------------------------------------
FROM node:22-alpine AS runtime
ENV NODE_ENV=production
ENV PORT=4000
WORKDIR /repo

# Solo cio che serve a runtime: dipendenze di produzione + artefatti compilati.
COPY --from=builder /repo/node_modules ./node_modules
COPY --from=builder /repo/package.json ./package.json
COPY --from=builder /repo/packages/shared-types/package.json ./packages/shared-types/package.json
COPY --from=builder /repo/packages/shared-types/dist ./packages/shared-types/dist
COPY --from=builder /repo/apps/backend/package.json ./apps/backend/package.json
COPY --from=builder /repo/apps/backend/dist ./apps/backend/dist

EXPOSE 4000
USER node
CMD ["node", "apps/backend/dist/server.js"]
