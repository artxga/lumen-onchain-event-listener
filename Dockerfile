FROM node:24-alpine

# Variables de entorno
ENV NODE_ENV=production

# Crear directorio
WORKDIR /app

# Copiar archivos de dependencias
COPY package.json pnpm-lock.yaml* ./

# Instalar pnpm y pm2
RUN npm install -g pnpm pm2

# Instalar dependencias
RUN pnpm install --frozen-lockfile

# Copiar el resto del proyecto (incluye src, tsconfig, env, etc)
COPY . .

# Compilar TypeScript
RUN pnpm exec tsc

# Comando PM2 runtime
CMD ["pm2-runtime", "start", "dist/index.js", "--name", "onchain-event-listener"]
