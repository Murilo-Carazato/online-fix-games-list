# busca a imagem do repositório docker (docker.io) e nomeia ele como builder
# porque ele vai apenas instalar e configurar o turbo, e trazer os arquivos
FROM docker.io/library/node:20-alpine AS builder

# cria no container um dir chamado app
WORKDIR /app

# instala dentro dele o turbo
RUN npm install -g turbo

# copia os arquivos do projeto todo (/Projects/online-fix-games-list) para o container
COPY . .

# agora que tem todos os arquivos do projeto, o turbo separa em diertórios: /app/out/json (package.json da raiz, da api, do backend-core), e out/full (código fonte da api e do backend-core). apenas os arquivos que da API e arquivos externos que ela usa (como a backend-core),
RUN turbo prune --scope=@hydra/api --docker

#
#

# a mini-imagem builder já copiou os arquivos necessários para a api funcionar

# criamos uma nova imagem zerada e nomeamos ele de installer
FROM docker.io/library/node:20-alpine AS installer

# cria o diretório para ela também
WORKDIR /app

# copia os arquivos q apontam as dependências do código fonte  completo da api presente nossa mini-imagem builder
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/package-lock.json ./package-lock.json

# agora q temos os arquivos q apontam as deps, instalamos as dependências
RUN npm ci

# copia o código fonte completo da api presente nossa mini-imagem builder
COPY --from=builder /app/out/full/ .

# copia o arquivo turbo.json do meu SO
COPY turbo.json turbo.json

# com as deps já instaladas + o código fonte completo da api, buildamos
RUN npx turbo run build --filter=@hydra/api

#
#

# nova imagem zerada
FROM docker.io/library/node:20-alpine AS runner

# cria o dir para ela
WORKDIR /app

# copia o código + deps prontas do installer
COPY --from=installer /app/ .

# Seta Node.js que estamos em produção (tira a depuração, logs de debug, ficando mais rápido)
ENV NODE_ENV=production

# aponta que o container usará a porta 3001
EXPOSE 3001

# quando o container liga, roda isso dentro dele para iniciar a api
CMD ["node", "apps/api/dist/index.js"]
