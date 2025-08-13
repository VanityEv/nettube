# Multi-stage Node.js Dockerfile for Streamply Backend
# Optimized for production with FFmpeg support

# Stage 1: Build dependencies
FROM node:lts-alpine AS dependencies

# Install system dependencies for FFmpeg and video processing
RUN apk add --no-cache \
    ffmpeg \
    ffmpeg-dev \
    python3 \
    make \
    g++ \
    curl

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies using npm
RUN npm ci --only=production

# Stage 2: Production build
FROM node:lts-alpine AS production

# Install runtime dependencies
RUN apk add --no-cache \
    ffmpeg \
    ffmpeg-libs \
    curl \
    dumb-init

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S streamply -u 1001 -G nodejs

# Set working directory
WORKDIR /app

# Copy dependencies from build stage
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/package.json ./package.json

# Copy application code
COPY --chown=streamply:nodejs . .

# Create temp directory for video processing
RUN mkdir -p /tmp/streamply && \
    chown -R streamply:nodejs /tmp/streamply

# Generate Prisma client
RUN npx prisma generate

# Create logs directory
RUN mkdir -p /app/logs && \
    chown -R streamply:nodejs /app/logs

# Set proper permissions
RUN chown -R streamply:nodejs /app

# Switch to non-root user
USER streamply

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "index.js"]
