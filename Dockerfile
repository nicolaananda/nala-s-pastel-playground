# Build stage
FROM node:20-alpine AS builder

# Install dependencies for sharp (image processing)
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    vips-dev

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY bun.lockb* ./

# Install dependencies
RUN npm ci --include=dev

# Copy source code
COPY . .

# Build the application (this will generate WebP images)
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 6612
EXPOSE 6612

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

