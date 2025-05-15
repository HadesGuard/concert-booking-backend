FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

WORKDIR /app
RUN npm run build:booking

CMD ["node", "dist/apps/booking-service/main.js"] 