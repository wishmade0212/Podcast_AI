# Use official Node.js runtime as base image
FROM node:18-alpine

# Set working directory in container
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
# Use --production to install only production dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create uploads directory (fallback if cloud storage fails)
RUN mkdir -p uploads/documents uploads/audio

# Expose port (Cloud Run will inject PORT env var)
EXPOSE 8080

# Set environment to production
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \  
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "server.js"]
