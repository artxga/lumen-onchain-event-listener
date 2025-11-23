FROM node:23-alpine

# Variables de entorno
ENV NODE_ENV=production

# Crear directorio de la app
WORKDIR /app

# Copiar archivos de dependencias
COPY package.json pnpm-lock.yaml* ./

# Instalar pnpm y dependencias
RUN npm install -g pnpm pm2
RUN pnpm install --frozen-lockfile

# Copiar el resto del proyecto
COPY . .

# Compilar TypeScript
RUN pnpm exec tsc

# Exponer puerto (opcional, si necesitas)
# EXPOSE 3000

# Comando para levantar listener con PM2-runtime
CMD ["pm2-runtime", "dist/listener.js", "--name", "polygon-listener"]
