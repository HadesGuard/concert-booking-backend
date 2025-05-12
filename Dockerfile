# Base image
FROM node:22-alpine

# Set workdir
WORKDIR /app

# Copy files
COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY apps ./apps
COPY libs ./libs

# Install deps
RUN npm install

# Build project
RUN npm run build

# CMD sẽ được override bởi docker-compose
CMD ["node"]