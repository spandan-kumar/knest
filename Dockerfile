# Build stage: use Bun for fast install/build
FROM oven/bun:1-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json bun.lock* ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy application code
COPY . .

# Set environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Generate Prisma Client
RUN bun x prisma generate

# Build Next.js application
RUN bun run build

# Production stage: use Bun for runtime (small, fast)
FROM oven/bun:1-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Copy runtime files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy Prisma files for migrations
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Create directory for SQLite database
RUN mkdir -p /app/prisma

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV BIND_HOST="0.0.0.0"

# Run migrations and start server
CMD ["sh", "-c", "bun x prisma migrate deploy && bun server.js"]