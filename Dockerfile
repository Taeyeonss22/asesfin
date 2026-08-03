# Etapa 1: Build de Vite
FROM node:22-alpine AS builder

WORKDIR /app

# Copiar configuración e instalar dependencias del frontend
COPY frontend/package*.json ./frontend/
WORKDIR /app/frontend
RUN npm install

# Copiar el resto del código del frontend
COPY frontend/ ./

# Construir la aplicación para producción
RUN npm run build

# Etapa 2: Servidor de producción Nginx
FROM nginx:alpine

# Configurar Nginx para SPA (React Router)
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
    location = /index.html { \
        root /usr/share/nginx/html; \
        add_header Cache-Control "no-store, no-cache, must-revalidate"; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Copiar los estáticos compilados desde la etapa de build
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
