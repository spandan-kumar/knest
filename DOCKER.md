# Docker Deployment Guide

This guide explains how to deploy KNest using Docker with solutions for common issues.

## Quick Start

### Option 1: Using Docker Compose (Recommended)

```bash
# Build and run with docker-compose
bun run docker:compose

# Stop the containers
bun run docker:compose:down
```

### Option 2: Using Docker directly

```bash
# Build the image (Node.js version - more stable)
bun run docker:build:node

# Run the container
bun run docker:run:node
```

## Troubleshooting Common Issues

### 1. lightningcss.linux-x64-gnu.node Error

This error occurs due to native module compatibility issues. We've provided two solutions:

#### Solution A: Use Node.js-based Dockerfile (Recommended)
```bash
# Use the Node.js version which has better native module support
bun run docker:build:node
bun run docker:run:node
```

#### Solution B: Use the original Bun Dockerfile with fixes
```bash
# The original Dockerfile has been updated with build tools
bun run docker:build
bun run docker:run
```

### 2. CSS Processing Issues

The PostCSS configuration has been updated to:
- Disable Turbopack in production builds
- Use cssnano instead of lightningcss for CSS optimization
- Provide better webpack configuration for native modules

### 3. Environment Variables

Make sure to create a `.env` file with your API keys:

```env
GEMINI_API_KEY=your_api_key_here
NODE_ENV=production
```

## Docker Images

### Dockerfile.node (Recommended)
- Based on Node.js 18 Alpine
- Better compatibility with native modules
- Uses Bun for package management but Node.js for runtime
- More stable for production deployments

### Dockerfile (Original)
- Based on Bun runtime
- Includes build tools for native module compilation
- Faster startup but may have compatibility issues

## Available Scripts

| Script | Description |
|--------|-------------|
| `bun run docker:build` | Build with Bun runtime |
| `bun run docker:build:node` | Build with Node.js runtime |
| `bun run docker:run` | Run Bun-based container |
| `bun run docker:run:node` | Run Node.js-based container |
| `bun run docker:compose` | Build and run with compose |
| `bun run docker:compose:down` | Stop compose containers |

## Health Checks

The application includes a health check endpoint at `/api/health` that returns:

```json
{
  "status": "healthy",
  "timestamp": "2025-01-31T...",
  "service": "KNest Meeting Analysis"
}
```

## Production Deployment

For production deployments:

1. Use the Node.js-based Docker image for stability
2. Set proper environment variables
3. Use a reverse proxy (nginx/traefik) for SSL termination
4. Configure proper resource limits
5. Set up monitoring and logging

Example docker-compose for production:

```yaml
version: '3.8'
services:
  knest:
    build:
      context: .
      dockerfile: Dockerfile.node
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - GEMINI_API_KEY=${GEMINI_API_KEY}
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M
```

## Architecture

The Docker setup uses multi-stage builds:

1. **deps**: Install dependencies
2. **builder**: Build the application
3. **runner**: Production runtime with minimal footprint

This ensures smaller final images and better security through minimal attack surface.