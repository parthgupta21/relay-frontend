FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
ENV RELAY_API_UPSTREAM=http://api:3000 \
    RELAY_INGEST_UPSTREAM=http://ingest:3000 \
    NGINX_ENVSUBST_FILTER=^RELAY_
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
