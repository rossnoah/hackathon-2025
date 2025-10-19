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

# Create directory for SQLite database with proper permissions
RUN mkdir -p /app/data && chmod 777 /app/data

# Expose port (Coolify will map this)
EXPOSE 4000

# Start the server
CMD ["node", "server.js"]
