# Use official Node.js image
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy all files
COPY . .

# Build the application (if needed)
# RUN npm run build

# Production stage
FROM node:18-alpine

# Install MongoDB command-line tools
RUN apk add --no-cache mongodb-tools

# Set working directory
WORKDIR /app

# Copy built application and dependencies
COPY --from=builder /app ./

# Install production dependencies
RUN npm prune --production

# Expose the app port
EXPOSE 3000

# Start the application
CMD ["node", "server.js"]
