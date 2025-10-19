# Use standard Node.js LTS version (Debian-based)
FROM node:20

# Install system dependencies for canvas
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
COPY api/prisma ./prisma/

# Install dependencies (including dev dependencies for build)
RUN npm ci

# Copy source files
COPY api/src ./src
COPY api/tsconfig.json ./

# Copy public files
COPY api/public ./public

# Generate Prisma Client and build TypeScript
RUN npm run build

# Create directory for SQLite database with proper permissions
RUN mkdir -p /app/data && chmod 777 /app/data

# Remove dev dependencies to reduce image size
RUN npm prune --production

# Expose port (Coolify will map this)
EXPOSE 4000

# Set environment variable for database location
ENV DATABASE_URL="file:./data/hackathon.db"

# Start the server
CMD ["node", "dist/index.js"]
