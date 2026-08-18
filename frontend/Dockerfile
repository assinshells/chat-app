# NOTE: build context for this Dockerfile is the repository root (see
# docker/prod/compose.yml), so paths below are relative to the repo root,
# not to the frontend/ directory. This lets us reach nginx/nginx.conf.

# --- Build stage ---
FROM node:22-alpine AS build
WORKDIR /app

# Vite bakes VITE_* vars into the bundle at build time, so they must be
# passed as build args here — setting them in docker-compose's
# `environment:` for this service (a build, not a running container) has
# no effect. Defaults are relative paths: nginx (see nginx.conf) proxies
# /api/ and /socket.io/ to the backend on the same origin, so the built
# app needs no absolute URL in production.
ARG VITE_API_URL=/api
ARG VITE_SOCKET_URL=
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY frontend/. .
RUN npm run build

# --- Serve stage ---
FROM nginx:1.27-alpine AS serve
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
