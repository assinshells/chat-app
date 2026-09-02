# --- Продакшн-образ для backend-сервісу ---
FROM node:22-alpine AS base
WORKDIR /app
ENV NODE_ENV=production

# Встановлюємо лише продакшн-залежності за lockfile для відтворюваних збірок
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund

# Копіюємо вихідний код застосунку
COPY src ./src

# Запускаємо від non-root користувача
RUN addgroup -S nodejs && adduser -S nodejs -G nodejs
USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:'+(process.env.PORT||3000)+'/health',res=>process.exit(res.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "src/server.js"]
