# VoicePilot - Unified Node.js Container
# Includes: Backend (Express + TypeScript) + Frontend (React + Vite)

# Stage 1: Build Frontend
FROM node:20-bookworm AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY voicepilot/frontend/package*.json ./

# Install frontend dependencies
RUN npm ci

# Copy frontend source code
COPY voicepilot/frontend/ ./

# Build frontend (outputs to dist/renderer/)
RUN npm run build:renderer

# Stage 2: Build Backend
FROM node:20-bookworm AS backend-builder

WORKDIR /app/backend

# Copy backend package files
COPY voicepilot-backend/package*.json ./

# Install backend dependencies (including devDependencies for build)
RUN npm ci

# Copy backend source code
COPY voicepilot-backend/ ./

# Build backend (TypeScript compilation)
RUN npm run build

# Stage 3: Production Image
FROM node:20-bookworm-slim

WORKDIR /app

# Create non-root user for security
RUN groupadd -r voicepilot && useradd -r -g voicepilot voicepilot

# Copy backend package files
COPY voicepilot-backend/package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev && npm cache clean --force

# Copy built backend from builder stage
COPY --from=backend-builder /app/backend/dist/ ./dist/

# Copy built frontend from frontend builder stage
# The frontend builds to dist/renderer/, we'll put it in public/ for serving
COPY --from=frontend-builder /app/frontend/dist/renderer/ ./public/

# Set proper ownership
RUN chown -R voicepilot:voicepilot /app

# Switch to non-root user
USER voicepilot

# Expose port 8080
EXPOSE 8080

# Environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# Start the backend server
CMD ["node", "dist/server.js"]