FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

WORKDIR /app
RUN npm run build:concert

CMD ["node", "dist/apps/concert-service/main.js"] 