FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

WORKDIR /app
RUN npm run build:auth

CMD ["node", "dist/apps/auth-service/main.js"] 