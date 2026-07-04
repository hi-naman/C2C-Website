# ---------- Stage 1: Build ----------------------------------------------
FROM node:24-slim AS builder

WORKDIR /app

# install OpenSSL (Prisma needs it)  (the slim image of node 24 does not contain this library)
RUN apt-get update -y && apt-get install -y openssl

# copy package files first (dependency layer caching)
COPY package*.json ./
RUN npm ci

# copy the rest of the source
COPY . .


# generate Prisma client + build TypeScript
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
RUN npx prisma generate
RUN npm run build

# ---------------- Stage 2: Production -----------------------
FROM node:24-slim AS production

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl

# only copy what's needed to run
COPY package*.json ./
RUN npm ci --omit=dev

# copy built output and prisma(module and schema etc...) from the builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./

EXPOSE 5000

# run migrations then start the server
CMD npx prisma migrate deploy && node dist/index.js