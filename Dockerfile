FROM node:22-alpine

WORKDIR /app

# Copia apenas o package.json primeiro para aproveitar cache
COPY package.json ./

# Instala dependências
RUN npm install

# Copia o restante do projeto
COPY . .

# Build de produção
RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

EXPOSE 3000

# Sobe o Next em modo produção
CMD ["npm", "start"]
