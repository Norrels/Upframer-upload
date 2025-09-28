FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat


FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev


FROM base AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci   # instala inclusive devDependencies (typescript, vitest, etc.)
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3333
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 api

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

RUN chown -R api:nodejs /app
USER api

EXPOSE 3333

CMD ["node", "dist/server.js"]
