# Dockerfile para Next.js Frontend
FROM node:18-alpine

WORKDIR /app

# Instalar pnpm y curl para health checks
RUN npm install -g pnpm && \
    apk add --no-cache curl

# Copiar archivos de dependencias
COPY package.json pnpm-lock.yaml ./

# Instalar dependencias
RUN pnpm install --frozen-lockfile

# Copiar código fuente
COPY . .

# Exponer puerto
EXPOSE 3000

# Comando para desarrollo
CMD ["pnpm", "dev"]
