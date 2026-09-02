# ПРИМІТКА: контекст збірки для цього Dockerfile — корінь репозиторію
# (див. docker/prod/compose.yml), тому шляхи нижче відносні до кореня
# репозиторію, а не до директорії frontend/. Це дозволяє дістатися до
# nginx/nginx.conf.

# --- Етап збірки ---
FROM node:22-alpine AS build
WORKDIR /app

# Vite вшиває змінні VITE_* у бандл на етапі збірки, тому їх потрібно
# передавати саме як build args тут — встановлення їх у `environment:`
# docker-compose для цього сервісу (це збірка, а не працюючий контейнер)
# не матиме ефекту. Значення за замовчуванням — відносні шляхи: nginx
# (див. nginx.conf) проксує /api/ і /socket.io/ до backend на тому ж
# origin, тому зібраному застосунку не потрібна абсолютна URL у продакшні.
ARG VITE_API_URL=/api
ARG VITE_SOCKET_URL=
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY frontend/. .
RUN npm run build

# --- Етап обслуговування ---
FROM nginx:1.27-alpine AS serve
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
