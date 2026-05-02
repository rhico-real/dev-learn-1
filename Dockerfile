# Stage 1: Build
FROM node:20-bookworm-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build
RUN npx prisma generate

# Stage 2: Run
FROM node:20-bookworm-slim AS runner

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev

RUN npx prisma generate

COPY --from=builder /app/dist ./dist



EXPOSE 3000

CMD ["node", "dist/src/main.js"]