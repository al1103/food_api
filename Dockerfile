FROM node:18-alpine

WORKDIR /usr/src/app

# Copy package files first for better layer caching
COPY package*.json ./

# Install build dependencies for bcrypt
RUN apk add --no-cache make gcc g++ python3 libc6-compat

# Install npm packages
RUN npm install
# Force bcrypt to rebuild from source
RUN npm rebuild bcrypt --build-from-source

# Copy application code
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["npm", "run", "dev"]