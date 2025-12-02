# ==========================================
# Stage 1: Base Image
# ==========================================
FROM node:22-alpine AS base

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# ==========================================
# Stage 2: Dependencies (Production)
# ==========================================
FROM base AS dependencies

# Install production dependencies only
RUN npm ci --only=production && npm cache clean --force

# ==========================================
# Stage 3: Build
# ==========================================
FROM base AS build

# Install all dependencies (including dev)
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# ==========================================
# Stage 4: Production Runtime
# ==========================================
FROM base AS production

# Set NODE_ENV
ENV NODE_ENV=production

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy production dependencies from dependencies stage
COPY --from=dependencies --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy built application from build stage
COPY --from=build --chown=nodejs:nodejs /app/dist ./dist

# Copy necessary files
COPY --chown=nodejs:nodejs package*.json ./

# Create uploads directory with proper permissions
RUN mkdir -p uploads/pdfs uploads/attachments && \
    chown -R nodejs:nodejs uploads

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "dist/index.js"]
