# Usar Node.js 18 Alpine como base
FROM node:18-alpine AS base

# Instalar dependencias necesarias
RUN apk add --no-cache dumb-init curl

# Establecer directorio de trabajo
WORKDIR /usr/src/app

# Copiar archivos de configuración de dependencias
COPY package*.json ./

# Etapa de desarrollo
FROM base AS development
RUN npm ci --only=development
COPY . .
CMD ["dumb-init", "npm", "run", "start:dev"]

# Etapa de construcción
FROM base AS build
RUN npm ci --only=development
COPY . .
RUN npm run build && npm prune --production

# Etapa de producción
FROM base AS production
ENV NODE_ENV=production
USER node

# Copiar dependencias de producción
COPY --chown=node:node --from=build /usr/src/app/node_modules ./node_modules

# Copiar aplicación construida
COPY --chown=node:node --from=build /usr/src/app/dist ./dist

# Copiar archivos de configuración necesarios
COPY --chown=node:node --from=build /usr/src/app/src/i18n ./dist/i18n

# Exponer puerto
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/v1/health || exit 1

# Comando para ejecutar la aplicación
CMD ["dumb-init", "node", "dist/main"] 