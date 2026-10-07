# Multi-stage build for CyberMesh
FROM node:20-alpine

WORKDIR /app

# Copy dependency manifests
COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/

# Install frontend dependencies and build
WORKDIR /app/frontend
RUN npm install
COPY frontend/ ./
RUN npm run build

# Install backend dependencies
WORKDIR /app/backend
RUN npm install --omit=dev
COPY backend/ ./

# Expose port
EXPOSE 5000

ENV PORT=5000
ENV NODE_ENV=production

CMD ["node", "src/server.js"]
