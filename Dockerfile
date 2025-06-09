# Dockerfile for Express + Vite server
FROM node:20-alpine AS build
WORKDIR /app
COPY . .
RUN npm install && npm run build

# Production image
FROM node:20-alpine
WORKDIR /app
COPY --from=build /app .
EXPOSE 3000
CMD ["node", "server.js"]