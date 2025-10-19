# Use standard Node.js LTS version (Debian-based)
FROM node:20

# Install system dependencies for better-sqlite3 and canvas
# These are already mostly available in the standard image
RUN apt-get update && apt-get install -y \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY api/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY api/ ./

# Create directory for SQLite database
RUN mkdir -p /app/data

# Expose port (Coolify will map this)
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the server
CMD ["node", "server.js"]
