FROM node:18-alpine

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies (including dev dependencies for development)
RUN npm install && \
    npm install -g nodemon

# Copy application files
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /usr/src/app

USER nodejs

EXPOSE 3000

# Use conditional command based on NODE_ENV
CMD ["sh", "-c", "if [ \"$NODE_ENV\" = \"production\" ]; then npm start; else npm run dev; fi"]