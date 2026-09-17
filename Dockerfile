# Production Dockerfile for Render Web Service (Express API + Python openpyxl)
FROM node:20-slim

# Install Python3 and pip for Excel export scripts
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-openpyxl && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Node dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy application files
COPY . .

# Set default port
ENV PORT=5000
ENV NODE_ENV=production

EXPOSE 5000

# Start Express backend server
CMD ["node", "server/index.js"]
