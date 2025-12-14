# ===== Build stage =====
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ===== Runtime stage =====
FROM node:20-alpine
WORKDIR /app

# Copy ONLY the adapter-node output
COPY --from=builder /app/build ./build

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=80

EXPOSE 80

CMD ["node", "build/index.js"]
